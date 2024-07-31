const mongoose = require('mongoose');

const activeKeySchema = new mongoose.Schema({
    active_key: {
        type: String,
        required: true,
        unique: true
    },
    hash_key: { 
        type: String 
    },
    device_id: { 
        type: String 
    },
}, { timestamps: true });

module.exports = mongoose.model('ActiveKey', activeKeySchema, 'key_active');
