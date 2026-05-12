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

app.use(cors({
  origin: ['https://personal-os1.vercel.app', 'http://localhost:5173'],
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
