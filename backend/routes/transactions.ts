import { Router, Request, Response } from 'express'
import { db } from '../database'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { type, category, month } = req.query
  let sql = 'SELECT * FROM transactions WHERE 1=1'
  const params: unknown[] = []
  if (type)     { sql += ' AND type = ?';             params.push(type) }
  if (category) { sql += ' AND category = ?';         params.push(category) }
  if (month)    { sql += ' AND strftime(\'%Y-%m\', date) = ?'; params.push(month) }
  sql += ' ORDER BY date DESC, created_at DESC'
  res.json(db.prepare(sql).all(...params))
})

router.post('/', (req: Request, res: Response) => {
  const { amount, type = 'expense', category = 'Sonstiges', description = '', date } = req.body
  if (amount == null || isNaN(Number(amount))) {
    res.status(400).json({ error: 'valid amount is required' }); return
  }
  const result = db.prepare(
    'INSERT INTO transactions (amount, type, category, description, date) VALUES (?, ?, ?, ?, ?)'
  ).run(Number(amount), type, category, description, date ?? null)
  res.status(201).json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid))
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { amount, type, category, description, date } = req.body
  if (!db.prepare('SELECT id FROM transactions WHERE id = ?').get(id)) {
    res.status(404).json({ error: 'not found' }); return
  }
  db.prepare(`
    UPDATE transactions SET
      amount      = COALESCE(?, amount),
      type        = COALESCE(?, type),
      category    = COALESCE(?, category),
      description = COALESCE(?, description),
      date        = COALESCE(?, date)
    WHERE id = ?
  `).run(amount != null ? Number(amount) : null, type ?? null, category ?? null, description ?? null, date ?? null, id)
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(id))
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id)
  if (result.changes === 0) { res.status(404).json({ error: 'not found' }); return }
  res.json({ success: true })
})

export default router
