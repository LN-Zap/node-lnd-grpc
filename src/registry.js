const commonServices = [
  {
    name: 'WalletUnlocker',
    proto: 'lnrpc/rpc.proto',
  },
  {
    name: 'Lightning',
    proto: 'lnrpc/rpc.proto',
  },
]

const v7Services = [
  ...commonServices,
  {
    name: 'Autopilot',
    proto: 'autopilotrpc/autopilot.proto',
  },
  {
    name: 'ChainNotifier',
    proto: 'chainrpc/chainnotifier.proto',
  },
  {
    name: 'Invoices',
    proto: 'invoicesrpc/invoices.proto',
  },
  {
    name: 'Router',
    proto: 'routerrpc/router.proto',
  },
  {
    name: 'Signer',
    proto: 'signrpc/signer.proto',
  },
  {
    name: 'WalletKit',
    proto: 'walletrpc/walletkit.proto',
  },
  {
    name: 'Watchtower',
    proto: 'watchtowerrpc/watchtowerrpc.proto',
  },
]

const v6Servicves = [
  ...commonServices,
  {
    name: 'Autopilot',
    proto: 'autopilotrpc/autopilot.proto',
  },
  {
    name: 'ChainNotifier',
    proto: 'chainrpc/chainnotifier.proto',
  },
  {
    name: 'Invoices',
    proto: 'invoicesrpc/invoices.proto',
  },
  {
    name: 'Router',
    proto: 'routerrpc/router.proto',
  },
  {
    name: 'Signer',
    proto: 'signrpc/signer.proto',
  },
  {
    name: 'WalletKit',
    proto: 'walletrpc/walletkit.proto',
  },
]

export default {
  '0.7.1-beta': {
    services: v7Services,
  },
  '0.7.0-beta': {
    services: v7Services,
  },
  '0.6.0-beta': {
    services: v6Servicves,
  },
  '0.5.2-beta': {
    services: commonServices,
  },
  '0.5.1-beta': {
    services: commonServices,
  },
  '0.5.0-beta': {
    services: commonServices,
  },
  '0.4.2-beta': {
    services: commonServices,
  },
}
