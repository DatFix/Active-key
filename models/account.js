const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    id_active_key:{
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema, 'accounts');
