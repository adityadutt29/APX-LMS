const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	password: {
		type: String,
		required: true,
	},
	role: {
		type: String,
		enum: ['student', 'teacher', 'admin'],
		required: true,
		default: 'student',
	},
	section: {
		type: String,
		required: function() {
			return this.role === 'student';
		},
		trim: true,
		uppercase: true,
	},
	teachingSections: [{
		type: String,
		trim: true,
		uppercase: true,
	}],
	department: {
		type: String,
		trim: true,
	},
	studentId: {
		type: String,
		unique: true,
		sparse: true,
		required: function() {
			return this.role === 'student';
		},
	},
	employeeId: {
		type: String,
		unique: true,
		sparse: true,
		required: function() {
			return this.role === 'teacher';
		},
	},
	avatar: {
		type: String,
		default: null,
	},
	phone: {
		type: String,
		trim: true,
	},
	year: {
		type: String,
		enum: ['1', '2', '3', '4'],
	},
	major: {
		type: String,
		trim: true,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (err) {
		next(err);
	}
});

module.exports = mongoose.model('User', UserSchema);
