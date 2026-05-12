import { Router, Request, Response } from 'express'
import { db } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all()
  res.json(rows)
})

router.post('/', (req: Request, res: Response) => {
  const { title } = req.body
  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  const result = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title.trim())
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(todo)
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { title, completed } = req.body
  const todo = db.prepare('SELECT id FROM todos WHERE id = ?').get(id)
  if (!todo) { res.status(404).json({ error: 'not found' }); return }

  db.prepare(`
    UPDATE todos SET
      title     = COALESCE(?, title),
      completed = COALESCE(?, completed)
    WHERE id = ?
  `).run(title ?? null, completed != null ? (completed ? 1 : 0) : null, id)

  res.json(db.prepare('SELECT * FROM todos WHERE id = ?').get(id))
})

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  if (result.changes === 0) { res.status(404).json({ error: 'not found' }); return }
  res.json({ success: true })
})

export default router
