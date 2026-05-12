import { Router, Request, Response } from 'express'
import { db } from '../database'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { type, status } = req.query
  let sql = 'SELECT * FROM media WHERE 1=1'
  const params: unknown[] = []
  if (type)   { sql += ' AND type = ?';   params.push(type) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC'
  res.json(db.prepare(sql).all(...params))
})

router.post('/', (req: Request, res: Response) => {
  const { title, type = 'movie', rating, status = 'want-to-watch', notes = '' } = req.body
  if (!title?.trim()) { res.status(400).json({ error: 'title is required' }); return }
  if (rating != null && (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
    res.status(400).json({ error: 'rating must be 1–5' }); return
  }
  const result = db.prepare(
    'INSERT INTO media (title, type, rating, status, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(title.trim(), type, rating != null ? Number(rating) : null, status, notes)
  res.status(201).json(db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid))
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { title, type, rating, status, notes } = req.body
  if (!db.prepare('SELECT id FROM media WHERE id = ?').get(id)) {
    res.status(404).json({ error: 'not found' }); return
  }
  db.prepare(`
    UPDATE media SET
      title  = COALESCE(?, title),
      type   = COALESCE(?, type),
      rating = COALESCE(?, rating),
      status = COALESCE(?, status),
      notes  = COALESCE(?, notes)
    WHERE id = ?
  `).run(title ?? null, type ?? null, rating != null ? Number(rating) : null, status ?? null, notes ?? null, id)
  res.json(db.prepare('SELECT * FROM media WHERE id = ?').get(id))
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id)
  if (result.changes === 0) { res.status(404).json({ error: 'not found' }); return }
  res.json({ success: true })
})

export default router
