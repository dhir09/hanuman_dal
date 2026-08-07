import { useEffect, useRef, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { ArrowLeft, Download, Upload, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { addPurpose as createPurpose, deletePurpose, getAllPurposes, getSettings, upsertSettings } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { useAuth } from '../auth/AuthContext'
import BilingualInput from '../components/BilingualInput'
import { exportBackup, importBackup } from '../lib/backup'

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const { signOut } = useAuth()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const settings = useQuery('settings', getSettings, [])
  const purposes = useQuery('purposes', getAllPurposes, [])

  const [orgEn, setOrgEn] = useState('')
  const [orgGu, setOrgGu] = useState('')
  const [addrEn, setAddrEn] = useState('')
  const [addrGu, setAddrGu] = useState('')
  const [phone, setPhone] = useState('')
  const [prefix, setPrefix] = useState('')
  const [newPurposeEn, setNewPurposeEn] = useState('')
  const [newPurposeGu, setNewPurposeGu] = useState('')

  useEffect(() => {
    if (settings) {
      setOrgEn(settings.orgName_en)
      setOrgGu(settings.orgName_gu)
      setAddrEn(settings.address_en)
      setAddrGu(settings.address_gu)
      setPhone(settings.phone)
      setPrefix(settings.receiptPrefix)
    }
  }, [settings])

  async function saveOrg() {
    await upsertSettings({
      orgName_en: orgEn.trim() || 'Hanuman Dal',
      orgName_gu: orgGu.trim() || 'હનુમાન દળ',
      address_en: addrEn.trim(),
      address_gu: addrGu.trim(),
      phone: phone.trim(),
      receiptPrefix: prefix.trim() || 'HD',
    })
    alert('✓')
  }

  async function addPurpose() {
    if (!newPurposeEn.trim() && !newPurposeGu.trim()) return
    await createPurpose({ name_en: newPurposeEn.trim(), name_gu: newPurposeGu.trim(), active: 1 })
    setNewPurposeEn(''); setNewPurposeGu('')
  }

  async function delPurpose(id: number) {
    await deletePurpose(id)
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm(t('importWarn'))) return
    try {
      await importBackup(file)
      alert('✓')
    } catch (err) {
      alert(String(err))
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">{t('nav_settings')}</h1>
      </div>

      {/* Language */}
      <div className="card">
        <div className="label">{t('language')}</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setLang('en')} className={lang === 'en' ? 'btn-primary' : 'btn-ghost'}>English</button>
          <button onClick={() => setLang('gu')} className={lang === 'gu' ? 'btn-primary' : 'btn-ghost'}>ગુજરાતી</button>
        </div>
      </div>

      {/* Org details */}
      <div className="card space-y-4">
        <div className="text-sm font-bold text-stone-700">{t('orgDetails')}</div>
        <BilingualInput label={t('orgName')} valueEn={orgEn} valueGu={orgGu} onEn={setOrgEn} onGu={setOrgGu} />
        <BilingualInput label={t('address')} valueEn={addrEn} valueGu={addrGu} onEn={setAddrEn} onGu={setAddrGu} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('phone')}</label>
            <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('receiptNo')} prefix</label>
            <input className="field" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="HD" />
          </div>
        </div>
        <button onClick={saveOrg} className="btn-primary w-full">{t('save')}</button>
      </div>

      {/* Purposes */}
      <div className="card space-y-3">
        <div className="text-sm font-bold text-stone-700">{t('managePurposes')}</div>
        <div className="space-y-1.5">
          {purposes?.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm">
              <span className="text-stone-700">{p.name_en} <span className="text-stone-400">/ {p.name_gu}</span></span>
              <button onClick={() => delPurpose(p.id!)} className="text-stone-400 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <BilingualInput label={t('add')} valueEn={newPurposeEn} valueGu={newPurposeGu} onEn={setNewPurposeEn} onGu={setNewPurposeGu} />
        <button onClick={addPurpose} className="btn-ghost w-full">
          <Plus size={16} /> {t('add')}
        </button>
      </div>

      {/* Backup */}
      <div className="card space-y-3">
        <div className="text-sm font-bold text-stone-700">{t('dataBackup')}</div>
        <p className="text-xs text-stone-500">{t('backupHint')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportBackup} className="btn-primary">
            <Download size={16} /> {t('exportBackup')}
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost">
            <Upload size={16} /> {t('importBackup')}
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
        </div>
      </div>

      <button onClick={() => signOut()} className="btn-ghost w-full text-red-600 hover:bg-red-50">Sign out</button>

      <div className="pb-4 text-center text-[10px] text-stone-400">
        Hanuman Dal · v1.0 · {t('backupHint')}
      </div>
    </div>
  )
}
