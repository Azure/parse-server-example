const MerchantTypeEnum = {
  H: { key: 'H', value: 'Hostelería' },
  T: { key: 'T', value: 'Transporte' },
  P: { key: 'P', value: 'Parking' },
  A: { key: 'A', value: 'Autopista' },
  G: { key: 'G', value: 'Gasolina' },
  O: { key: 'O', value: 'Otro' }
};

module.exports = {
  getMerchantType(type) {
    if (type) {
      return MerchantTypeEnum[type].value;
    }
    return null;
  }
};
