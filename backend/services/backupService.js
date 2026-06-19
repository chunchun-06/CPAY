'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// All collections to back up / restore
const COLLECTIONS = ['admins', 'customers', 'loans', 'payments', 'auditlogs'];

/**
 * Export all MongoDB collections as a JSON-serializable object.
 * @returns {Promise<Object>} { collectionName: [...documents], exportedAt, version }
 */
const exportCollections = async () => {
  const db = mongoose.connection.db;
  const result = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    collections: {},
  };

  for (const name of COLLECTIONS) {
    try {
      const collection = db.collection(name);
      const docs = await collection.find({}).toArray();
      result.collections[name] = docs;
      logger.info(`Exported ${docs.length} documents from '${name}'`);
    } catch (err) {
      logger.warn(`Could not export collection '${name}': ${err.message}`);
      result.collections[name] = [];
    }
  }

  return result;
};

/**
 * Import/restore collections from a backup object.
 * WARNING: This replaces existing data in each collection.
 *
 * @param {Object} backupData - Object produced by exportCollections()
 * @returns {Promise<Object>} Summary of restore results
 */
const importCollections = async (backupData) => {
  if (!backupData || !backupData.collections) {
    throw new Error('Invalid backup data: missing collections field');
  }

  const db = mongoose.connection.db;
  const summary = {};

  for (const [name, docs] of Object.entries(backupData.collections)) {
    if (!COLLECTIONS.includes(name)) {
      logger.warn(`Skipping unknown collection '${name}' during restore`);
      continue;
    }

    try {
      const collection = db.collection(name);

      // Drop existing data
      await collection.deleteMany({});

      if (docs && docs.length > 0) {
        // Convert _id strings back to ObjectId where needed
        const sanitized = docs.map((doc) => {
          if (doc._id && typeof doc._id === 'string') {
            try {
              doc._id = new mongoose.Types.ObjectId(doc._id);
            } catch (_) {
              // keep as-is
            }
          }
          return doc;
        });
        await collection.insertMany(sanitized, { ordered: false });
      }

      summary[name] = { restored: docs?.length || 0, status: 'success' };
      logger.info(`Restored ${docs?.length || 0} documents to '${name}'`);
    } catch (err) {
      summary[name] = { status: 'error', message: err.message };
      logger.error(`Error restoring collection '${name}': ${err.message}`);
    }
  }

  return summary;
};

module.exports = { exportCollections, importCollections };
