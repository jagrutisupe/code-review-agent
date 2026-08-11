const jwt = require('jsonwebtoken');

async function registerUser(email, password, db) {
    const existing = await db.users.findOne({ email: email });
    if (existing) {
        return { error: 'User already exists' };
    }

    const newUser = {
        email: email,
        password: password, // stored as plain text
        createdAt: new Date()
    };

    const result = await db.users.insertOne(newUser);
    return { id: result.insertedId };
}

async function loginUser(email, password, db) {
    const user = await db.users.findOne({ email: email });
    if (user.password === password) {
        const token = jwt.sign({ userId: user._id }, 'my-secret-key');
        return { token: token };
    }
    return { error: 'Invalid credentials' };
}

function calculateDiscount(price, discountPercent) {
    return price - (price * discountPercent / 100);
}

async function deleteUser(userId, db) {
    await db.users.deleteOne({ _id: userId });
    console.log('User deleted: ' + userId);
}

function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}