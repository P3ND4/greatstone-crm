import { useState } from 'react';
import { Eye, Lock, MailPlus, RotateCw, Send, UserCheck, UserX, X } from 'lucide-react';
import { useSession } from '../../app/SessionProvider.jsx';
import { PersonCell, RowMenu } from '../../components/crm/bits.jsx';
import { ConfirmDialog, FormShell, ModalShell } from '../../components/shells/index.js';
import { Badge, Button, Card, DataState, Field, Input, Select, SkeletonList, Table, Textarea, useToast } from '../../components/ui/index.js';
import useForm, { isEmail } from '../../hooks/useForm.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { ago } from '../../lib/format.js';
import { SETTINGS_META, settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection, useSettingsAccess } from './shared.jsx';

const LEVELS = ['none', 'view', 'full'];
const LEVEL_TONE = { none: 'danger', view: 'info', full: 'success' };

function InviteModal({ open, onClose, onSaved, existing }) {
  const t = useT();
  const toast = useToast();
  const form = useForm({ email: '', role: 'designer', message: '' }, {
    validate: (v) => ({
      email: !v.email.trim() ? t('validation.required')
        : !isEmail(v.email) ? t('validation.email')
          : existing.includes(v.email.trim().toLowerCase()) && t('settings.users.alreadyMember'),
    }),
    onSubmit: async (v) => {
      await settingsService.invite(v);
      toast.show(t('settings.users.invited', { email: v.email.trim() }));
      onSaved();
      onClose();
    },
  });
  return (
    <ModalShell open={open} onClose={onClose} size="sm" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={t('settings.users.inviteTitle')} subtitle={t('settings.users.inviteSub')} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={t('settings.users.sendInvite')}>
          <div className="stack">
            <Field label={t('settings.fields.email')} error={form.errors.email} required><Input {...form.bind('email')} type="email" autoComplete="off" placeholder="name@example.com" data-autofocus /></Field>
            <Field label={t('settings.users.role')} hint={t(`settings.roleDesc.${form.values.role}`)}>
              <Select {...form.bind('role')} options={SETTINGS_META.roles.map((r) => ({ value: r, label: t(`roles.${r}`) }))} />
            </Field>
            <Field label={t('settings.users.message')} optional><Textarea {...form.bind('message')} minRows={2} maxRows={5} /></Field>
            <p className="field__hint">{t('settings.users.inviteNote')}</p>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}

function Team({ readOnly }) {
  const t = useT();
  const toast = useToast();
  const session = useSession();
  const { data, loading, error, refetch } = useResource(() => settingsService.team(), []);
  const [inviting, setInviting] = useState(false);
  const [revoke, setRevoke] = useState(null);

  const changeRole = async (u, role) => {
    await settingsService.setRole(u.id, role);
    toast.show(t('settings.users.roleChanged', { name: u.name, role: t(`roles.${role}`) }));
    refetch();
  };
  const toggleStatus = async (u) => {
    const next = u.status === 'inactive' ? 'active' : 'inactive';
    await settingsService.setUserStatus(u.id, next);
    toast.show(t(next === 'inactive' ? 'settings.users.deactivated' : 'settings.users.reactivated', { name: u.name }));
    refetch();
  };

  const users = data?.users || [];
  const invites = data?.invites || [];
  return (
    <>
      <Card
        flush
        className="list-card"
        title={t('settings.users.team')}
        subtitle={t('settings.users.teamSub', { n: users.filter((u) => u.status !== 'inactive').length })}
        actions={<Button size="sm" variant="primary" icon={MailPlus} onClick={() => setInviting(true)} disabled={readOnly}>{t('settings.users.invite')}</Button>}
      >
        <DataState loading={loading} error={error} onRetry={refetch} skeleton={<div style={{ padding: 16 }}><SkeletonList rows={4} /></div>}>
          <Table
            caption={t('settings.users.team')}
            rows={users}
            rowClassName={(u) => (u.status === 'inactive' ? 'is-muted' : undefined)}
            columns={[
              { key: 'name', header: t('list.name'), render: (u) => <PersonCell name={u.name} sub={u.email} dark={u.id === session.user.id} /> },
              { key: 'title', header: t('settings.fields.jobTitle'), hide: 'lg', render: (u) => <span className="muted">{u.title}</span> },
              {
                key: 'role', header: t('settings.users.role'), width: 170,
                render: (u) => (u.id === session.user.id
                  ? <span className="row" style={{ gap: 6 }}><Badge tone="accent">{t(`roles.${u.role}`)}</Badge><span className="subtle" style={{ fontSize: 12 }}>{t('settings.viewAs.you')}</span></span>
                  : <Select className="select--sm" value={u.role} disabled={readOnly || u.status === 'inactive'} aria-label={t('settings.users.roleFor', { name: u.name })} onChange={(e) => changeRole(u, e.target.value)} options={SETTINGS_META.roles.map((r) => ({ value: r, label: t(`roles.${r}`) }))} />),
              },
              { key: 'status', header: t('list.status'), hide: 'md', render: (u) => <Badge tone={u.status === 'inactive' ? 'neutral' : 'success'} dot>{t(u.status === 'inactive' ? 'settings.users.inactive' : 'settings.users.active')}</Badge> },
              {
                key: 'menu', header: <span className="sr-only">{t('common.actions')}</span>, align: 'right', width: 56,
                render: (u) => (u.id === session.user.id || readOnly ? null : (
                  <RowMenu label={t('settings.users.actionsFor', { name: u.name })} items={[
                    { label: t('settings.viewAs.previewRole', { role: t(`roles.${u.role}`) }), icon: Eye, onClick: () => session.setViewAs(u.role) },
                    u.status === 'inactive'
                      ? { label: t('settings.users.reactivate'), icon: UserCheck, onClick: () => toggleStatus(u) }
                      : { label: t('settings.users.deactivate'), icon: UserX, onClick: () => toggleStatus(u) },
                  ]} />
                )),
              },
            ]}
          />
          {invites.length > 0 && (
            <div className="invites">
              <h3 className="invites__title">{t('settings.users.pending', { n: invites.length })}</h3>
              <ul className="invites__list">
                {invites.map((i) => (
                  <li key={i.id} className="invites__row">
                    <span className="invites__icon" aria-hidden="true"><Send /></span>
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="truncate" style={{ display: 'block', fontWeight: 500 }}>{i.email}</span>
                      <span className="subtle" style={{ fontSize: 12 }}>{t(`roles.${i.role}`)} · {t('settings.users.sent', { when: ago(i.sentAt) })}</span>
                    </span>
                    <Button size="sm" variant="ghost" icon={RotateCw} disabled={readOnly} onClick={async () => { await settingsService.resendInvite(i.id); toast.show(t('settings.users.resent', { email: i.email })); refetch(); }}>{t('settings.users.resend')}</Button>
                    <Button size="sm" variant="ghost" icon={X} disabled={readOnly} onClick={() => setRevoke(i)} aria-label={t('settings.users.revokeFor', { email: i.email })}><span className="hide-mobile">{t('settings.users.revoke')}</span></Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DataState>
      </Card>
      {inviting && <InviteModal open onClose={() => setInviting(false)} onSaved={refetch} existing={[...users.map((u) => u.email), ...invites.map((i) => i.email)]} />}
      <ConfirmDialog
        open={Boolean(revoke)}
        title={t('settings.users.revokeTitle')}
        body={revoke && t('settings.users.revokeBody', { email: revoke.email })}
        confirmLabel={t('settings.users.revoke')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setRevoke(null)}
        onConfirm={async () => { const r = revoke; setRevoke(null); await settingsService.revokeInvite(r.id); toast.show(t('settings.users.revoked', { email: r.email })); refetch(); }}
      />
    </>
  );
}

function Permissions() {
  const t = useT();
  const session = useSession();
  const { data, loading, error, refetch } = useResource(() => settingsService.permissions(), []);
  const roles = SETTINGS_META.roles;
  return (
    <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={6} />}>
      {data && (
        <SettingsForm initial={data} savedKey="settings.users.permissionsSaved" onSave={async (v) => { await settingsService.savePermissions(v); session.refresh(); }}>
          {(form) => (
            <SettingsSection
              title={t('settings.users.permissions')}
              description={t('settings.users.permissionsDesc')}
              aside={<ul className="level-legend">{LEVELS.map((l) => <li key={l}><Badge tone={LEVEL_TONE[l]} dot>{t(`settings.level.${l}`)}</Badge><span>{t(`settings.levelDesc.${l}`)}</span></li>)}</ul>}
            >
              <div className="table-wrap">
                <table className="table perm-table">
                  <caption className="sr-only">{t('settings.users.permissions')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('settings.users.module')}</th>
                      {roles.map((r) => <th key={r} scope="col">{t(`roles.${r}`)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SETTINGS_META.modules.map((m) => (
                      <tr key={m}>
                        <th scope="row">{t(`nav.${m}`)}</th>
                        {roles.map((r) => (
                          <td key={r}>
                            {r === 'admin'
                              ? <span className="row" style={{ gap: 6 }}><Lock size={13} className="subtle" aria-hidden="true" /><Badge tone="success" dot>{t('settings.level.full')}</Badge></span>
                              : (
                                <Select
                                  className={`select--sm perm-select perm-select--${form.values[m][r]}`}
                                  value={form.values[m][r]}
                                  aria-label={t('settings.users.levelFor', { module: t(`nav.${m}`), role: t(`roles.${r}`) })}
                                  onChange={(e) => form.set(m, { ...form.values[m], [r]: e.target.value })}
                                  options={LEVELS.map((l) => ({ value: l, label: t(`settings.level.${l}`) }))}
                                />
                              )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="field__hint" style={{ marginTop: 12 }}>{t('settings.users.permissionsNote')}</p>
            </SettingsSection>
          )}
        </SettingsForm>
      )}
    </DataState>
  );
}

function ViewAsCard() {
  const t = useT();
  const { role, realRole, setViewAs } = useSession();
  const [pick, setPick] = useState(role === realRole ? 'designer' : role);
  return (
    <SettingsSection title={t('settings.viewAs.title')} description={t('settings.viewAs.desc')}>
      <div className="row wrap-row" style={{ alignItems: 'flex-end' }}>
        <Field label={t('settings.users.role')} className="grow">
          <Select value={pick} onChange={(e) => setPick(e.target.value)} options={SETTINGS_META.roles.map((r) => ({ value: r, label: t(`roles.${r}`) }))} />
        </Field>
        <Button variant="primary" icon={Eye} onClick={() => setViewAs(pick)} disabled={pick === role}>{t('settings.viewAs.start')}</Button>
        {role !== realRole && <Button onClick={() => setViewAs(null)}>{t('settings.viewAs.exit')}</Button>}
      </div>
      <p className="field__hint" style={{ marginTop: 10 }}>{t(`settings.roleDesc.${pick}`)}</p>
    </SettingsSection>
  );
}

export default function UsersSettings() {
  const { readOnly } = useSettingsAccess();
  return (
    <>
      <SettingsHeader section="users" />
      <div className="stack-lg">
        <Team readOnly={readOnly} />
        <Permissions />
        <ViewAsCard />
      </div>
    </>
  );
}
