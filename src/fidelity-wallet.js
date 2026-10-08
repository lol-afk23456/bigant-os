// Adattato dal dominio Fidelity GitHub 350d64f. Solo generatori puri; nessuna firma o invio.
                                                  
import { createHash } from 'node:crypto';
class WalletError extends Error { constructor(message, code, status = 503) { super(message); this.code = code; this.status = status; } }

export function validateWalletData(member              , program               )       {
  if (!member.id || !member.publicToken || !member.name || !program.id || !program.name || !program.tenantName ||
    !['stamps', 'points', 'coupon'].includes(program.type) ||
    !Number.isSafeInteger(member.balance) || member.balance < 0 ||
    !Number.isSafeInteger(member.rewardCount) || member.rewardCount < 0 ||
    !Number.isSafeInteger(program.rewardThreshold) || program.rewardThreshold < 1 ||
    !Number.isFinite(Date.parse(member.updatedAt)) ||
    (program.expiresAt !== undefined && !Number.isFinite(Date.parse(program.expiresAt)))) {
    throw new WalletError('Dati tessera non validi.', 'WALLET_INVALID_DATA', 422);
  }
  if ((program.locations?.length ?? 0) > 10 || program.locations?.some(location =>
    !Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 ||
    !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180)) {
    throw new WalletError('Specificare fino a 10 coordinate geografiche valide.', 'WALLET_INVALID_DATA', 422);
  }
}

export function walletColor(color        )         {
  if (/^#[a-f\d]{6}$/i.test(color)) return color;
  if (/^#[a-f\d]{3}$/i.test(color)) return `#${[...color.slice(1)].map(c => c + c).join('')}`;
  return '#174436';
}

export function googlePassIds(issuer        , member              , program               ) {
  if (!/^\d+$/.test(issuer)) throw new WalletError('GOOGLE_ISSUER_ID non valido.', 'WALLET_CONFIGURATION');
  const suffix = (value        ) => createHash('sha256').update(value).digest('hex').slice(0, 40);
  return { classId: `${issuer}.program_${suffix(program.id)}`, objectId: `${issuer}.member_${suffix(`${program.id}:${member.id}`)}` };
}

export function buildGooglePayloads(member              , program               , issuer        , baseUrl        ) {
  validateWalletData(member, program);
  const { classId, objectId } = googlePassIds(issuer, member, program);
  const logo = program.logoUrl ?? `${baseUrl}/api/fidelity/wallet/icon.png`;
  try {
    const url = new URL(logo);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch { throw new WalletError('Il logo Google Wallet deve avere un URL HTTPS pubblico.', 'WALLET_INVALID_DATA', 422); }
  const image = { sourceUri: { uri: logo }, contentDescription: { defaultValue: { language: 'it', value: program.tenantName } } };
  const cardUrl = `${baseUrl}/fidelity/card/${encodeURIComponent(member.publicToken)}`;
  const classCommon = {
    id: classId,
    issuerName: program.tenantName,
    reviewStatus: 'UNDER_REVIEW',
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    ...(program.locations?.length ? { merchantLocations: program.locations.map(({ latitude, longitude }) => ({ latitude, longitude })) } : {}),
  };
  const objectCommon = {
    id: objectId,
    classId,
    state: member.voided || (program.type === 'coupon' && member.balance === 0) ? 'INACTIVE' : 'ACTIVE',
    ...(program.expiresAt ? { validTimeInterval: { end: { date: new Date(program.expiresAt).toISOString() } } } : {}),
    barcode: { type: 'QR_CODE', value: member.publicToken },
    linksModuleData: { uris: [{ id: 'card', uri: cardUrl, description: 'Apri la tua tessera' }] },
    textModulesData: [
      { id: 'reward', header: 'Il tuo premio', body: program.rewardName },
      { id: 'details', header: 'Come funziona', body: program.description || program.name },
      { id: 'redeemed', header: 'Premi riscattati', body: String(member.rewardCount) },
      ...(member.offer ? [{ id: 'offer', header: 'Novità dal negozio', body: member.offer }] : []),
    ],
  };
  if (program.type === 'coupon') {
    return { kind: 'offer'         , classPayload: { ...classCommon, title: program.name,
      provider: program.tenantName, redemptionChannel: 'INSTORE', titleImage: image,
      details: program.description || program.rewardName },
    objectPayload: { ...objectCommon } };
  }
  return { kind: 'loyalty'         ,
    classPayload: { ...classCommon, programName: program.name, programLogo: image,
      hexBackgroundColor: walletColor(program.color), accountNameLabel: 'Cliente', accountIdLabel: 'Tessera' },
    objectPayload: { ...objectCommon, accountId: member.id, accountName: member.name,
      loyaltyPoints: { label: program.type === 'stamps' ? 'Timbri' : 'Punti', balance: { int: member.balance } },
      secondaryLoyaltyPoints: { label: 'Premi disponibili', balance: { int: Math.floor(member.balance / program.rewardThreshold) } } } };
}

export function buildGoogleMessage(message                                             ) {
  if (!message.id?.trim() || !message.title?.trim() || !message.body?.trim() ||
    message.title.length > 100 || message.body.length > 1000 || message.id.length > 200) {
    throw new WalletError('Messaggio Wallet non valido (titolo massimo 100 caratteri, testo 1000).', 'WALLET_INVALID_DATA', 422);
  }
  // Messages intentionally contain plain text only; never untrusted HTML/link markup.
  const plainText = (value        ) => value.replace(/[<>]/g, '');
  return { message: { id: message.id, header: plainText(message.title), body: plainText(message.body), messageType: 'TEXT_AND_NOTIFY' } };
}

                                                  
export function buildAppleDefinition(member              , program               ,
  config                                                         ) {
  validateWalletData(member, program);
  if (member.appleAuthToken.length < 16 || !config.passTypeId.startsWith('pass.') || !config.teamId) {
    throw new WalletError('Identificativi o token Apple Wallet non validi.', 'WALLET_INVALID_DATA', 422);
  }
  const rgb = walletColor(program.color).slice(1).match(/../g) .map(v => Number.parseInt(v, 16));
  const isLight = rgb[0]  * 0.299 + rgb[1]  * 0.587 + rgb[2]  * 0.114 > 160;
  const fields = {
    headerFields: [{ key: 'balance', label: program.type === 'coupon' ? 'STATO' : program.type === 'stamps' ? 'TIMBRI' : 'PUNTI',
      value: program.type === 'coupon' ? (member.balance > 0 ? 'Disponibile' : 'Utilizzato') : `${member.balance} / ${program.rewardThreshold}` }],
    primaryFields: [{ key: 'program', label: program.tenantName, value: program.name }],
    secondaryFields: [{ key: 'name', label: 'CLIENTE', value: member.name },
      { key: 'rewards', label: 'PREMI DISPONIBILI', value: program.type === 'coupon' ? member.balance : Math.floor(member.balance / program.rewardThreshold) }],
    auxiliaryFields: [{ key: 'reward', label: 'IL TUO PREMIO', value: program.rewardName }],
    backFields: [
      { key: 'description', label: 'Come funziona', value: program.description || program.name },
      { key: 'web', label: 'La tua tessera', value: `${config.baseUrl}/fidelity/card/${encodeURIComponent(member.publicToken)}` },
      { key: 'updated', label: 'Ultimo aggiornamento', value: new Date(member.updatedAt).toISOString() },
      { key: 'redeemed', label: 'Premi riscattati', value: member.rewardCount },
      // Marketing content can appear on the pass but never abuses changeMessage for push campaigns.
      ...(member.offer ? [{ key: 'offer', label: 'Novità dal negozio', value: member.offer }] : []),
    ],
  };
  return {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeId,
    teamIdentifier: config.teamId,
    serialNumber: member.id,
    organizationName: program.tenantName,
    description: program.name,
    logoText: program.tenantName,
    backgroundColor: `rgb(${rgb.join(', ')})`,
    foregroundColor: isLight ? 'rgb(23, 35, 30)' : 'rgb(255, 255, 255)',
    labelColor: isLight ? 'rgb(40, 55, 46)' : 'rgb(231, 239, 228)',
    authenticationToken: member.appleAuthToken,
    webServiceURL: `${config.baseUrl}/api/fidelity/wallet/apple`,
    sharingProhibited: true,
    barcodes: [{ format: 'PKBarcodeFormatQR', message: member.publicToken, messageEncoding: 'utf-8' }],
    [program.type === 'coupon' ? 'coupon' : 'storeCard']: fields,
    ...(member.voided || (program.type === 'coupon' && member.balance === 0) ? { voided: true } : {}),
    ...(program.expiresAt ? { expirationDate: new Date(program.expiresAt).toISOString() } : {}),
    ...(program.locations?.length ? { locations: program.locations } : {}),
  };
}

