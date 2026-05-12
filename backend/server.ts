import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import todoRoutes from './routes/todos'
import noteRoutes from './routes/notes'
import contactRoutes from './routes/contacts'
import transactionRoutes from './routes/transactions'
import mediaRoutes from './routes/media'

const app = express()
const PORT = 3001

app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

app.use('/api/auth',         authRoutes)
app.use('/api/todos',        todoRoutes)
app.use('/api/notes',        noteRoutes)
app.use('/api/contacts',     contactRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/media',        mediaRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
