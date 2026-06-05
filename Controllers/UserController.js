const User = require('../Models/UserModel');
const generateToken = require('../Utils/generateToken');

const SignUpUser = async (req, res) => {
    try {
        const { firstname, lastname, email, phone, password, role } = req.body;

        if (!firstname || !lastname || !email || !password)
            return res.status(400).json({ message: 'Please provide all required fields' });

        if (await User.findOne({ email }))
            return res.status(400).json({ message: 'Email already registered' });

        // UserModel pre-save hook handles password hashing — do NOT hash here
        const user = await User.create({ firstname, lastname, email, phone, password, role: role || 'user' });

        res.status(201).json({
            message: 'User registered successfully',
            token: generateToken(user),
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

        res.json({
            message: 'Login successful',
            token: generateToken(user),
            data: { id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, phone: user.phone, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
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

module.exports = { SignUpUser, LoginUser, GetProfile, UpdateProfile, GetAllUsers, DeleteUser };
