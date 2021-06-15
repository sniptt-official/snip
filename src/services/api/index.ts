import addMemberToVault from './methods/addMemberToVault';
import addSecret from './methods/addSecret';
import configureAccount from './methods/configureAccount';
import createOneTimeSecret from './methods/createOneTimeSecret';
import createVault from './methods/createVault';
import deleteSecret from './methods/deleteSecret';
import listVaultMembers from './methods/listVaultMembers';
import listVaultMemberships from './methods/listVaultMemberships';
import listVaultSecrets from './methods/listVaultSecrets';
import registerDevice from './methods/registerDevice';
import removeMemberFromVault from './methods/removeMemberFromVault';
import retrieveAccountConfiguration from './methods/retrieveAccountConfiguration';
import retrieveAccountPublicKey from './methods/retrieveAccountPublicKey';
import retrieveSecret from './methods/retrieveSecret';
import retrieveVaultKeys from './methods/retrieveVaultKeys';
import searchVaultMemberships from './methods/searchVaultMemberships';
import sendEmailVerificationCode from './methods/sendEmailVerificationCode';

export default {
  addMemberToVault,
  addSecret,
  configureAccount,
  createOneTimeSecret,
  createVault,
  deleteSecret,
  listVaultMembers,
  listVaultMemberships,
  listVaultSecrets,
  registerDevice,
  removeMemberFromVault,
  retrieveAccountConfiguration,
  retrieveAccountPublicKey,
  retrieveSecret,
  retrieveVaultKeys,
  searchVaultMemberships,
  sendEmailVerificationCode,
};
