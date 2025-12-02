exports.register = (req, res, next) => { res.status(200).json({ success: true, token: 'fake-token' }); };
exports.login = (req, res, next) => { res.status(200).json({ success: true, token: 'fake-token' }); };
exports.getMe = (req, res, next) => { res.status(200).json({ success: true, data: { id: '1', name: 'User', role: 'user' } }); };
exports.logout = (req, res, next) => { res.status(200).json({ success: true, data: {} }); };
exports.updateDetails = (req, res, next) => { res.status(200).json({ success: true, data: {} }); };
exports.updatePassword = (req, res, next) => { res.status(200).json({ success: true, data: {} }); };
