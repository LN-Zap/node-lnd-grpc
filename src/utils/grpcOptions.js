// The following options object closely approximates the existing behavior of grpc.load.
// See https://github.com/grpc/grpc-node/blob/master/packages/grpc-protobufjs/README.md
const grpcOptions = {
  keepCase: false,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
}

export default grpcOptions
