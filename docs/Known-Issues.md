# Known Issues

- `resolveAddress` is a stub; it always returns `matched: false`. Real
  Bharat Address Graph lookup + Claude disambiguation is Phase 1 work.
- No AWS resources are provisioned; `infrastructure/terraform` is a
  placeholder only.
- No authentication on the `address-resolver` API yet.
