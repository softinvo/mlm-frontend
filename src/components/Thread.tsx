import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';

export interface ThreadMessage { id: string; from: 'USER' | 'ADMIN'; author: string; body: string; at: string; internal?: boolean; attachments?: string[] }

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** A conversation: your messages on one side, the support team's on the other. Photos open full size. Internal notes (head office only) are shaded. */
export default function Thread({ messages, you }: { messages: ThreadMessage[]; you: 'USER' | 'ADMIN' }) {
  const end = useRef<HTMLLIElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);
  return (
    <>
      <ul className="thread" aria-label="Conversation">
        {messages.map((m) => (
          <li key={m.id} className={`msg ${m.from === you ? 'mine' : 'theirs'} ${m.internal ? 'internal' : ''}`}>
            <div className="bubble">
              {m.internal && <span className="internal-tag">Private note · only the head office sees this</span>}
              {m.body && <p>{m.body}</p>}
              {!!m.attachments?.length && (
                <div className="msg-photos">
                  {m.attachments.map((u) => <button type="button" key={u} className="msg-photo" onClick={() => setPhoto(u)} aria-label="View photo"><img src={u} alt="Attached photo" loading="lazy" /></button>)}
                </div>
              )}
            </div>
            <small className="muted">{m.author} · {when(m.at)}</small>
          </li>
        ))}
        <li ref={end} aria-hidden="true" />
      </ul>
      {photo && <Modal title="Photo" onClose={() => setPhoto(null)}><img className="photo-large" src={photo} alt="Attached photo" /><p className="muted small-note"><a href={photo} target="_blank" rel="noreferrer">Open original</a></p></Modal>}
    </>
  );
}
