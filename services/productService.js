const { db } = require('../config/firebase');

class ProductService {
  constructor() {
    this.collection = db.collection('products');
  }

  async createProduct(productData) {
    const docRef = await this.collection.add({
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  async findProductById(productId) {
    const doc = await this.collection.doc(productId).get();
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() };
  }

  async findProducts(filters = {}, limit = 20, offset = 0) {
    let query = this.collection.where('isActive', '==', true);

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.isFeatured !== undefined) {
      query = query.where('isFeatured', '==', filters.isFeatured);
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getAllProducts() {
    const snapshot = await this.collection
      .where('isActive', '==', true)
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by createdAt in descending order (newest first)
    return products.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return dateB - dateA;
    });
  }

  async updateProduct(productId, productData) {
    await this.collection.doc(productId).update({
      ...productData,
      updatedAt: new Date()
    });
    
    return await this.findProductById(productId);
  }

  async deleteProduct(productId) {
    await this.collection.doc(productId).update({
      isActive: false,
      updatedAt: new Date()
    });
    
    return true;
  }

  async searchProducts(searchTerm, limit = 20) {
    const snapshot = await this.collection
      .where('isActive', '==', true)
      .limit(limit)
      .get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  async findProductsBySku(sku) {
    const snapshot = await this.collection.where('sku', '==', sku).get();
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
}

module.exports = new ProductService();