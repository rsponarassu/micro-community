'use client'

import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import EventForm from '@/app/components/EventForm'
import { Plus } from 'lucide-react'

interface CommunityEventsHeaderProps {
  communityId: string
  canCreate: boolean
  totalEvents: number
}

export default function CommunityEventsHeader({
  communityId,
  canCreate,
  totalEvents,
}: CommunityEventsHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Community Events</h2>
          <p className="text-xs text-muted">
            {totalEvents} {totalEvents === 1 ? 'event' : 'events'} scheduled
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Host New Event</span>
          </button>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule a Community Event"
        description="Fill in the details to host an in-person meetup or virtual session."
        maxWidth="lg"
      >
        <EventForm
          communityId={communityId}
          onSuccess={() => setModalOpen(false)}
        />
      </Modal>
    </>
  )
}
