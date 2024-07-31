const express = require('express');
const os = require('os');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const exphbs = require('express-handlebars');
const ActiveKey = require('./models/activeKey');
const Account = require('./models/account');
require('dotenv').config();

const app = express();
const port = 8080;

// Cấu hình để sử dụng CORS
app.use(cors());

// Sử dụng express.json() để nhận dữ liệu JSON từ client
app.use(express.json());

// Kết nối đến MongoDB Atlas
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

// Kết nối đến MongoDB Atlas
const uri = `mongodb+srv://${username}:${password}@huynhvinhdat.ucww9qg.mongodb.net/ActivationCode?retryWrites=true&w=majority`;

async function connectToDatabase() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
    }
}

// Gọi hàm kết nối đến MongoDB khi khởi động server
connectToDatabase();

// Endpoint để lấy mã kích hoạt ngẫu nhiên
app.get('/activation-code', function (req, res) {
    const activationCode = generateActivationCode();
    res.json({ active_key: activationCode });
});

// Hàm tạo mã kích hoạt ngẫu nhiên
function generateActivationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let active_key = '';
    for (let i = 0; i < 5; i++) {
        let part = '';
        for (let j = 0; j < 5; j++) {
            part += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        active_key += part + (i < 4 ? '-' : '');
    }
    return active_key;
}

app.get('/active-key', async function (req, res) {
    try {
        const activationCodes = await ActiveKey.find({}); // Sử dụng model ActiveKey
        res.status(200).json(activationCodes);
    } catch (error) {
        console.error('Error fetching activation codes:', error);
        res.status(500).json({ error: 'Failed to fetch activation codes' });
    }
});

app.post("/authen", async (req, res) => {
    const active_key = req.body.active_key;
    const device_id = req.body.device_id;
    const stringKey = active_key + device_id;

    const saltRounds = 5;

    try {
        const hash = await bcrypt.hash(stringKey, saltRounds);
        const activeKey = await ActiveKey.findOne({ active_key: active_key });

        if (!activeKey) {
            return res.status(404).json({ error: 'Mã kích hoạt không hợp lệ' });
        }

        if (activeKey.hash_key) {
            console.log("Cập nhật thất bại");
            return res.status(404).json({ error: 'Hash key đã tồn tại. Tài khoản đã kích hoạt' });
        } else {
            await ActiveKey.findOneAndUpdate(
                { active_key: active_key },
                { $set: { hash_key: hash, device_id: device_id } }
            );
            console.log("Cập nhật thành công");
        }

        res.json({ hashedKey: hash });
    } catch (err) {
        console.error('Error hashing stringKey:', err);
        res.status(500).json({ error: 'Error hashing stringKey' });
    }
})

app.post('/check-authen', async (req, res) => {
    const active_key = req.body.active_key;
    const device_id = req.body.device_id;

    try {
        const hash_key_db = await ActiveKey.findOne({ active_key: active_key });

        if (!hash_key_db) {
            return res.status(404).json({ error: 'Active key không hợp lệ' });
        }

        const hash_key = hash_key_db.hash_key;
        const isMatch = await bcrypt.compare(active_key + device_id, hash_key);
        if (isMatch) {
            console.log("Xác thực thành công!");
            return res.json({ message: "Xác thực thành công!" });
        } else {
            console.log("Xác thực thất bại!");
            return res.status(401).json({ error: 'Xác thực thất bại!' });
        }
    } catch (err) {
        console.error('Error during authentication:', err);
        res.status(500).json({ error: 'Error during authentication' });
    }
});

app.post('/check-login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username hoặc password không hợp lệ!' });
    }

    try {
        const account = await Account.findOne({ username: username });

        if (!account) {
            return res.status(401).json({ error: 'Đăng nhập thất bại! Tên đăng nhập không đúng.' });
        }

        const isPasswordValid = await bcrypt.compare(password, account.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Đăng nhập thất bại! Mật khẩu không đúng.' });
        }

        return res.status(200).json({ message: 'Đăng nhập thành công!' });
    } catch (err) {
        console.error('Đăng nhập thất bại:', err);
        res.status(500).json({ error: 'Đăng nhập thất bại' });
    }
});

app.post('/add-id-active-key-to-account-collection', async function (req, res) {
    const username = req.body.username;
    const active_key = req.body.active_key;
    const activeKey = await ActiveKey.findOne({ active_key: active_key });

    if (!activeKey) {
        return res.status(404).json({ error: 'Mã thiết bị không được tìm thấy' });
    }

    const result = await Account.findOneAndUpdate(
        { username: username },
        { $set: { id_active_key: activeKey._id } }
    );

    console.log("Cập nhật id mã kích hoạt thành công");
    return res.status(200).json({ message: 'Cập nhật thành công!' });
});

// Endpoint để lưu mã kích hoạt vào MongoDB
app.post('/save-activation-code', async function (req, res) {
    const activationCode = req.body.active_key;

    if (!activationCode) {
        return res.status(400).json({ error: 'Activation code is required' });
    }

    try {
        const result = await ActiveKey.create({ active_key: activationCode }); // Sử dụng model ActiveKey
        res.status(201).json({ message: 'Tạo Active Key thành công', id: result._id });
    } catch (error) {
        console.error('Error saving activation code:', error);
        res.status(500).json({ error: 'Tạo Active Key thất bại' });
    }
});

app.post('/create-account', async function (req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username và Password không được để trống' });
    }

    const is_username = await Account.findOne({ username: username });
    if (is_username) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    try {
        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(password, saltRounds);
        const result = await Account.create({ username: username, password: hashPassword }); // Sử dụng model Account
        console.log("Cập nhật thành công");
        return res.status(201).json({ message: 'Tài khoản đã được tạo thành công', accountId: result._id });
    } catch (error) {
        console.error('Error creating account:', error.message || error);
        return res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo tài khoản' });
    }
});

app.get('/get-account', async function (req, res) {
    try {
        const accounts = await Account.find({}); // Sử dụng model Account
        res.status(200).json(accounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// Trang chủ
// ************************************
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req, res) => {
    try {
        const activationCodes = await ActiveKey.find({});
        res.render('index', {
            title: 'Activation Code',
            activationCodes: activationCodes
        });
    } catch (error) {
        console.error('Error fetching activation codes:', error);
        res.status(500).json({ error: 'Failed to fetch activation codes' });
    }
});

app.listen(port, function () {
    console.log("Your app running on port " + port);
});
