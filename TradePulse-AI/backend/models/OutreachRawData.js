const mongoose = require('mongoose');

const outreachRawDataSchema = new mongoose.Schema({
    Record_ID: { type: String, required: true, unique: true },
    Date: { type: Date, default: Date.now },
    Buyer_ID: { type: String, required: true },
    Country: String,
    Industry: String,
    Revenue_Size_USD: Number,
    Headcount_Size: Number,
    Job_Promotion_Flag: { type: Number, enum: [0, 1] },
    Hiring_Increase_Flag: { type: Number, enum: [0, 1] },
    Revenue_Growth_Score: Number,
    LinkedIn_Active: { type: Number, enum: [0, 1] },
    LinkedIn_Post_Engagement: Number,
    LinkedIn_Profile_Views: Number,
    Group_Memberships: String,
    Email_Verified: { type: Number, enum: [0, 1] },
    Email_Open_Rate: Number,
    Email_Reply_History: String,
    Cold_Call_Response: String,
    WhatsApp_Verified: { type: Number, enum: [0, 1] },
    SMS_Verified: { type: Number, enum: [0, 1] },
    Clay_Intent_Signal: Number,
    Apollo_Engagement_Score: Number,
    Lusha_Data_Confidence: Number,
    Previous_Channel_Response: String,
    Preferred_Channel_Label: String
}, { timestamps: true });

module.exports = mongoose.model('OutreachRawData', outreachRawDataSchema);
