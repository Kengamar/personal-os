import { Router, Request, Response } from 'express'
import { db } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM contacts ORDER BY name ASC').all()
  res.json(rows)
})

router.post('/', (req: Request, res: Response) => {
  const { name, email = '', phone = '', notes = '' } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return }
  const result = db.prepare(
    'INSERT INTO contacts (name, email, phone, notes) VALUES (?, ?, ?, ?)'
  ).run(name.trim(), email.trim(), phone.trim(), notes.trim())
  res.status(201).json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid))
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { name, email, phone, notes } = req.body
  if (!db.prepare('SELECT id FROM contacts WHERE id = ?').get(id)) {
    res.status(404).json({ error: 'not found' }); return
  }
  db.prepare(`
    UPDATE contacts SET
      name  = COALESCE(?, name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(name ?? null, email ?? null, phone ?? null, notes ?? null, id)
  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(id))
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id)
  if (result.changes === 0) { res.status(404).json({ error: 'not found' }); return }
  res.json({ success: true })
})

export default router
