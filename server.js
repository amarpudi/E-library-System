const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'super_secret_library_key';
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, 'library.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

// Models
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'user' } // 'user' or 'admin'
});

const Book = sequelize.define('Book', {
  title: { type: DataTypes.STRING, allowNull: false },
  author: { type: DataTypes.STRING, allowNull: false },
  genre: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  coverImage: { type: DataTypes.STRING },
  pdfUrl: { type: DataTypes.STRING },
  available: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const BorrowRecord = sequelize.define('BorrowRecord', {
  borrowDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  returnDate: { type: DataTypes.DATE, allowNull: true }
});

// Associations
User.hasMany(BorrowRecord);
BorrowRecord.belongsTo(User);
Book.hasMany(BorrowRecord);
BorrowRecord.belongsTo(Book);

// Sync DB and seed dummy data (only if tables are empty)
sequelize.sync().then(async () => {
  console.log('Database synced');

  const userCount = await User.count();
  if (userCount === 0) {
    // Create Dummy Admin
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashedAdminPassword, role: 'admin' });

    // Create Dummy User
    const hashedUserPassword = await bcrypt.hash('user123', 10);
    await User.create({ username: 'user', password: hashedUserPassword, role: 'user' });

    // Create Dummy Books
    await Book.bulkCreate([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Classic',
        description: 'A story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
        pdfUrl: '#'
      },
      {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        description: 'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real.',
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
        pdfUrl: '#'
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
        coverImage: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=600&auto=format&fit=crop',
        pdfUrl: '#'
      },
      {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        description: 'Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language.',
        coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop',
        pdfUrl: '#'
      }
    ]);
    console.log('Dummy data inserted');
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes
app.get('/', (req, res) => {
  res.send('E-Library Backend is running! Please use the frontend application to interact with the system.');
});

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });

  if (!user) return res.status(400).json({ error: 'User not found' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// --- Book Routes ---
app.get('/api/books', async (req, res) => {
  const { search } = req.query;
  let whereClause = {};

  if (search) {
    whereClause = {
      [Sequelize.Op.or]: [
        { title: { [Sequelize.Op.like]: `%${search}%` } },
        { author: { [Sequelize.Op.like]: `%${search}%` } },
        { genre: { [Sequelize.Op.like]: `%${search}%` } }
      ]
    };
  }

  const books = await Book.findAll({ where: whereClause });
  res.json(books);
});

app.get('/api/books/:id', async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (book) res.json(book);
  else res.status(404).json({ error: 'Book not found' });
});

// --- Admin Routes ---
app.post('/api/books', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, genre, description, coverImage, pdfUrl } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }
    const book = await Book.create({
      title,
      author,
      genre: genre || '',
      description: description || '',
      coverImage: coverImage || '',
      pdfUrl: pdfUrl || '#',
      available: true
    });
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

app.delete('/api/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    await book.destroy();
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// --- Borrow Routes ---
app.post('/api/transactions/borrow', authenticateToken, async (req, res) => {
  const { bookId } = req.body;
  const userId = req.user.id;

  const book = await Book.findByPk(bookId);
  if (!book || !book.available) {
    return res.status(400).json({ error: 'Book not available' });
  }

  await BorrowRecord.create({ UserId: userId, BookId: bookId });
  await book.update({ available: false });

  res.json({ message: 'Book borrowed successfully' });
});

// Borrow a World Catalog book (auto-import + borrow in one step)
app.post('/api/transactions/borrow-external', authenticateToken, async (req, res) => {
  const { title, author, genre, description, coverImage, pdfUrl } = req.body;
  const userId = req.user.id;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  try {
    const { Op } = require('sequelize');
    const existingBook = await Book.findOne({ where: { title, author } });

    if (existingBook) {
      const alreadyBorrowed = await BorrowRecord.findOne({
        where: { UserId: userId, BookId: existingBook.id, returnDate: null }
      });
      if (alreadyBorrowed) {
        return res.status(400).json({ error: 'You already have this book borrowed' });
      }

      if (!existingBook.available) {
        return res.status(400).json({ error: 'This book is currently borrowed by someone else' });
      }

      const record = await BorrowRecord.create({ UserId: userId, BookId: existingBook.id });
      await existingBook.update({ available: false });
      return res.json({ message: 'Book borrowed successfully', recordId: record.id, bookId: existingBook.id });
    }

    const newBook = await Book.create({
      title,
      author,
      genre: genre || '',
      description: (description || '').slice(0, 1000),
      coverImage: coverImage || '',
      pdfUrl: pdfUrl || '#',
      available: false
    });

    const record = await BorrowRecord.create({ UserId: userId, BookId: newBook.id });
    res.status(201).json({ message: 'Book imported and borrowed successfully', recordId: record.id, bookId: newBook.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to borrow book' });
  }
});

app.post('/api/transactions/return', authenticateToken, async (req, res) => {
  const { recordId } = req.body;
  const userId = req.user.id;

  const record = await BorrowRecord.findOne({ where: { id: recordId, UserId: userId, returnDate: null } });
  if (!record) {
    return res.status(400).json({ error: 'Invalid record or already returned' });
  }

  await record.update({ returnDate: new Date() });
  const book = await Book.findByPk(record.BookId);
  await book.update({ available: true });

  res.json({ message: 'Book returned successfully' });
});

app.get('/api/users/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const records = await BorrowRecord.findAll({
    where: { UserId: userId },
    include: [Book]
  });
  res.json(records);
});

// Start Server — always last, after all routes and middleware are registered
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
