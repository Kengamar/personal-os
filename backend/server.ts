import express from 'express'
import cors from 'cors'
import authRoutes        from './routes/auth'
import todoRoutes        from './routes/todos'
import noteRoutes        from './routes/notes'
import contactRoutes     from './routes/contacts'
import transactionRoutes from './routes/transactions'
import mediaRoutes       from './routes/media'

const app  = express()
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGINS = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/.*\.onrender\.com$/,
  /^https:\/\/.*\.vercel\.app$/,
]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const allowed = ALLOWED_ORIGINS.some(p => p.test(origin))
    cb(allowed ? null : new Error('Not allowed by CORS'), allowed)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ status: 'Personal OS API is running' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', port: PORT })
})

app.use('/api/auth',         authRoutes)
app.use('/api/todos',        todoRoutes)
app.use('/api/notes',        noteRoutes)
app.use('/api/contacts',     contactRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/media',        mediaRoutes)

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
