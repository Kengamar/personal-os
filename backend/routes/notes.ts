import { Router, Request, Response } from 'express'
import { db } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all()
  res.json(rows)
})

router.post('/', (req: Request, res: Response) => {
  const { title = '', content = '', category = 'general' } = req.body
  const result = db.prepare(
    'INSERT INTO notes (title, content, category) VALUES (?, ?, ?)'
  ).run(title.trim(), content, category.trim())
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid))
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { title, content, category } = req.body
  if (!db.prepare('SELECT id FROM notes WHERE id = ?').get(id)) {
    res.status(404).json({ error: 'not found' }); return
  }
  db.prepare(`
    UPDATE notes SET
      title    = COALESCE(?, title),
      content  = COALESCE(?, content),
      category = COALESCE(?, category)
    WHERE id = ?
  `).run(title ?? null, content ?? null, category ?? null, id)
  res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(id))
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id)
  if (result.changes === 0) { res.status(404).json({ error: 'not found' }); return }
  res.json({ success: true })
})

export default router
