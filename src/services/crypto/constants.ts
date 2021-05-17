import type {EllipticCurveName} from 'openpgp'

export const ECC_CURVES: Array<EllipticCurveName> = [
  'curve25519',
  'ed25519',
  'p256',
  'p384',
  'p521',
  'brainpoolP256r1',
  'brainpoolP384r1',
  'brainpoolP512r1',
  'secp256k1',
]
