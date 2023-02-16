import cloneDeep from 'lodash.clonedeep'

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

const v6Servicves = cloneDeep([
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
])

const v7Services = cloneDeep([
  ...v6Servicves,
  {
    name: 'Watchtower',
    proto: 'watchtowerrpc/watchtower.proto',
  },
])

const v8Services = cloneDeep([
  ...v7Services,
  {
    name: 'WatchtowerClient',
    proto: 'wtclientrpc/wtclient.proto',
  },
])

const v9Services = cloneDeep([...v8Services])

const v10Services = cloneDeep([
  ...v9Services,
  {
    name: 'Versioner',
    proto: 'verrpc/verrpc.proto',
  },
])

const v11Services = cloneDeep([...v10Services])

v11Services.map((service) => {
  if (service.name === 'WalletUnlocker') {
    service.proto = 'lnrpc/walletunlocker.proto'
  }
  return service
})

const v12Services = cloneDeep([...v11Services])

const v13Services = cloneDeep([
  ...v12Services,
  {
    name: 'State',
    proto: 'lnrpc/stateservice.proto',
  },
])

const v14Services = cloneDeep([...v13Services])

v14Services.map((service) => {
  if (service.name === 'Lightning') {
    service.proto = 'lnrpc/lightning.proto'
  }
  return service
})

export default {
  '0.14.4-beta': {
    services: v14Services,
  },
  '0.14.3-beta': {
    services: v14Services,
  },
  '0.14.2-beta': {
    services: v14Services,
  },
  '0.14.1-beta': {
    services: v14Services,
  },
  '0.14.0-beta': {
    services: v14Services,
  },
  '0.13.1-beta': {
    services: v13Services,
  },
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
