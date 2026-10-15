import mongoose, { Schema, Document } from 'mongoose';
import { env } from '../config/env.js';
import { RiskLevel, ChannelGuess, IndicatorSeverity } from '../types/contract.js';

export interface IIndicatorSummary {
  category: string;
  severity: IndicatorSeverity;
  count: number;
}

export interface IAnalysisRecord extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  riskLevel: RiskLevel;
  finalScore: number;
  indicatorSummary: IIndicatorSummary[];
  textHash: string;
  redactedPreview: string;
  explanationSummary: string;
  aiAvailable: boolean;
  channelGuess: ChannelGuess;
}

const IndicatorSummarySchema = new Schema<IIndicatorSummary>(
  {
    category: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    count: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const AnalysisRecordSchema = new Schema<IAnalysisRecord>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    finalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    indicatorSummary: {
      type: [IndicatorSummarySchema],
      default: [],
    },
    textHash: {
      type: String,
      required: true,
      index: true,
    },
    redactedPreview: {
      type: String,
      required: true,
      maxlength: 120,
    },
    explanationSummary: {
      type: String,
      required: true,
      maxlength: 500,
    },
    aiAvailable: {
      type: Boolean,
      required: true,
      default: false,
    },
    channelGuess: {
      type: String,
      enum: ['email', 'sms', 'chat', 'unknown'],
      required: true,
      default: 'unknown',
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL index to automatically purge records after HISTORY_TTL_DAYS (default 30 days)
const ttlSeconds = (env.HISTORY_TTL_DAYS || 30) * 24 * 60 * 60;
AnalysisRecordSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlSeconds });

export const AnalysisRecord = mongoose.model<IAnalysisRecord>(
  'AnalysisRecord',
  AnalysisRecordSchema
);
