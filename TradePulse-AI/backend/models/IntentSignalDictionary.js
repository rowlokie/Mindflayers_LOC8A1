const mongoose = require('mongoose');

const intentSignalDictionarySchema = new mongoose.Schema({
    Signal_Name: { type: String, required: true, unique: true },
    Description: String
});

module.exports = mongoose.model('IntentSignalDictionary', intentSignalDictionarySchema);
