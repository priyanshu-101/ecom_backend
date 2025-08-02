const { db } = require('../config/firebase');

class AuthService {
  constructor() {
    this.collection = db.collection('users');
  }

  async createUser(userData) {
    const docRef = await this.collection.add({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  async findUserByEmail(email) {
    const snapshot = await this.collection.where('email', '==', email).get();
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async findUserById(userId) {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() };
  }

  async updateUser(userId, userData) {
    await this.collection.doc(userId).update({
      ...userData,
      updatedAt: new Date()
    });
    
    return await this.findUserById(userId);
  }

  async addAddress(userId, addressData) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const addresses = user.addresses || [];
    
    if (addressData.isDefault) {
      addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      id: Date.now().toString(),
      ...addressData,
      isDefault: addressData.isDefault || addresses.length === 0
    };

    addresses.push(newAddress);

    await this.collection.doc(userId).update({
      addresses,
      updatedAt: new Date()
    });

    return addresses;
  }

  async updateAddress(userId, addressId, addressData) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const addresses = user.addresses || [];
    const addressIndex = addresses.findIndex(addr => addr.id === addressId);
    
    if (addressIndex === -1) {
      throw new Error('Address not found');
    }

    if (addressData.isDefault) {
      addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...addressData,
      id: addressId
    };

    await this.collection.doc(userId).update({
      addresses,
      updatedAt: new Date()
    });

    return addresses;
  }

  async deleteAddress(userId, addressId) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const addresses = user.addresses || [];
    const filteredAddresses = addresses.filter(addr => addr.id !== addressId);

    await this.collection.doc(userId).update({
      addresses: filteredAddresses,
      updatedAt: new Date()
    });

    return filteredAddresses;
  }
}

module.exports = new AuthService();