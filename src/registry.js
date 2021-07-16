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

const v7Services = [
  ...v6Servicves,
  {
    name: 'Watchtower',
    proto: 'watchtowerrpc/watchtowerrpc.proto',
  },
]

const v8Services = [
  ...v7Services,
  {
    name: 'WatchtowerClient',
    proto: 'wtclientrpc/wtclientrpc.proto',
  },
]

const v9Services = [...v8Services]

const v10Services = [
  ...v9Services,
  {
    name: 'Versioner',
    proto: 'verrpc/verrpc.proto',
  },
]

const v11Services = [
  ...v10Services,
  {
    name: 'WalletUnlocker',
    proto: 'lnrpc/walletunlocker.proto',
  },
]
v11Services.map((service) => {
  if (service.name === 'WalletUnlocker') {
    service.proto = 'lnrpc/walletunlocker.proto'
  }
  return service
})

const v12Services = [...v11Services]

const v13Services = [...v12Services]

export default {
  '0.13.0-beta': {
    services: v13Services,
  },
  '0.12.0-beta': {
    services: v12Services,
  },
  '0.11.1-beta': {
    services: v11Services,
  },
  '0.11.0-beta': {
    services: v11Services,
  },
  '0.10.1-beta': {
    services: v10Services,
  },
  '0.10.0-beta': {
    services: v10Services,
  },
  '0.9.0-beta': {
    services: v9Services,
  },
  '0.8.0-beta': {
    services: v8Services,
  },
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
