const User = require('../Models/UserModel');
const generateToken = require('../Utils/generateToken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const SignUpUser = async (req, res) => {
    try {
        const { firstname, lastname, email, phone, password, role } = req.body;

        if (!firstname || !lastname || !email || !password)
            return res.status(400).json({ message: 'Please provide all required fields' });

        if (await User.findOne({ email }))
            return res.status(400).json({ message: 'Email already registered' });

        const user = await User.create({ firstname, lastname, email, phone, password, role: role || 'user' });

        res.cookie('trailbliss_token', generateToken(user), cookieOptions);

        res.status(201).json({
            message: 'User registered successfully',
            data: { id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, phone: user.phone, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        res.cookie('trailbliss_token', generateToken(user), cookieOptions);

        res.json({
            message: 'Login successful',
            data: { id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, phone: user.phone, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

const LogoutUser = (req, res) => {
    res.clearCookie('trailbliss_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    res.json({ message: 'Logged out successfully' });
};

const GetProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ data: user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

const UpdateProfile = async (req, res) => {
    try {
        const { firstname, lastname, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { firstname, lastname, phone },
            { new: true, runValidators: true }
        ).select('-password');
        res.json({ message: 'Profile updated', data: user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

const GetAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ data: users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

const DeleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

const SendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

        await resend.emails.send({
            from: 'TrailBliss <onboarding@resend.dev>',
            to: email,
            subject: 'Your TrailBliss Password Reset OTP',
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:12px;border:1px solid #e5e7eb">
                    <h2 style="color:#1a1a2e">🌍 TrailBliss</h2>
                    <p>Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
                    <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4f46e5;text-align:center;padding:24px 0">${otp}</div>
                    <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
                </div>
            `,
        });

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

const VerifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const record = otpStore[email];

        if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
        if (Date.now() > record.expiresAt) {
            delete otpStore[email];
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        res.json({ message: 'OTP verified' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP', error: error.message });
    }
};

const ResetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const record = otpStore[email];

        if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
        if (Date.now() > record.expiresAt) {
            delete otpStore[email];
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

        const user = await User.findOne({ email });
        user.password = password;
        await user.save();

        delete otpStore[email];
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

const GoogleCallback = async (req, res) => {
    try {
        const { googleId, email, firstname, lastname, avatar } = req.body;

        if (!googleId || !email) return res.status(400).json({ message: 'Invalid Google data' });

        let user = await User.findOne({ googleId });

        if (!user) {
            // Check if email already exists (registered with password)
            user = await User.findOne({ email });
            if (user) {
                // Link Google account to existing user
                user.googleId = googleId;
                if (avatar && !user.avatar) user.avatar = avatar;
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    googleId,
                    firstname,
                    lastname,
                    email,
                    avatar: avatar || '',
                    isVerified: true,
                });
            }
        }

        res.cookie('trailbliss_token', generateToken(user), cookieOptions);
        res.json({
            message: 'Google login successful',
            data: { id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, phone: user.phone, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Google login failed', error: error.message });
    }
};

module.exports = { SignUpUser, LoginUser, LogoutUser, GetProfile, UpdateProfile, GetAllUsers, DeleteUser, SendOTP, VerifyOTP, ResetPassword, GoogleCallback };
