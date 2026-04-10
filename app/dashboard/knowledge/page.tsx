'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquare,
  LogOut,
  Plus,
  Trash2,
  FileText,
  BookOpen,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface KBDocument {
  id: string
  title: string
  source_type: string
  status: string
  chunk_count: number
  created_at: string
  updated_at: string
}

export default function KnowledgeBasePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<KBDocument[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch documents')
      }
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add document')
      }

      setSuccess(`"${title}" added with ${data.chunk_count} searchable chunks.`)
      setTitle('')
      setContent('')
      setShowAdd(false)
      await fetchDocuments()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Delete "${docTitle}"? This removes it from the knowledge base permanently.`)) {
      return
    }

    setDeleting(docId)
    setError(null)

    try {
      const res = await fetch(`/api/knowledge?id=${docId}`, { method: 'DELETE' })

      if (!res.ok) {
        throw new Error('Failed to delete document')
      }

      setSuccess(`"${docTitle}" deleted.`)
      await fetchDocuments()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground">ITSquare</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Back + Title */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                Knowledge Base
              </h1>
              <p className="text-muted-foreground mt-1">
                Add company docs so the AI can give team-specific answers.
              </p>
            </div>
            <Button onClick={() => setShowAdd(!showAdd)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>
        </div>

        {/* Status messages */}
        {error && (
          <Card className="mb-6 bg-destructive/5 border-destructive/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 bg-green-500/5 border-green-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Add Document Form */}
        {showAdd && (
          <Card className="mb-8 bg-surface border-border/50">
            <CardHeader>
              <CardTitle>Add a Document</CardTitle>
              <CardDescription>
                Paste company documentation, IT policies, how-to guides, or FAQ content.
                The AI will use this to answer employee questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., VPN Setup Guide, IT Policies, WiFi Instructions"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste the full text of the document here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length > 0
                      ? `${content.length.toLocaleString()} characters · ~${Math.ceil(content.length / 4).toLocaleString()} tokens`
                      : 'Max 500,000 characters'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Add to Knowledge Base'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        {documents.length === 0 ? (
          <Card className="bg-surface border-border/50">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No documents yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add company documentation, IT policies, or how-to guides. The AI will search
                these when answering employee questions.
              </p>
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="bg-surface border-border/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{doc.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span>{doc.chunk_count} chunks</span>
                      <span>·</span>
                      <span>{doc.source_type}</span>
                      <span>·</span>
                      <span>
                        {doc.status === 'active' && '✅ Active'}
                        {doc.status === 'processing' && '⏳ Processing'}
                        {doc.status === 'error' && '❌ Error'}
                      </span>
                      <span>·</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id, doc.title)}
                    disabled={deleting === doc.id}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    {deleting === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
