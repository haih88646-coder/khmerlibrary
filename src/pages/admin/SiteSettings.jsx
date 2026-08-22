import { useState, useEffect } from 'react';
import { Save, Upload, Image, RotateCcw, Bot } from 'lucide-react';
import Button from '../../components/common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { updateSiteSettings, uploadLogo, uploadBanner, uploadQrCode } from '../../supabase/siteSettings';
import { AI_PROVIDERS } from '../../utils/aiAssistant';
import { validateCoverImage } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function SiteSettingsPage() {
  const { lang, t } = useLanguage();
  const { settings, refreshSettings } = useSiteSettings();
  const [form, setForm] = useState({
    name_km: '', name_en: '', tagline_km: '', tagline_en: '', logoUrl: '',
    footer_about_km: '', footer_about_en: '', contact_email: '', contact_website: '',
    heroImageUrl: '', donateQrUrl: '', donate_text_km: '', donate_text_en: '',
    ai_provider: '', ai_model: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerProgress, setBannerProgress] = useState(0);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [qrProgress, setQrProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        name_km: settings.name_km || '',
        name_en: settings.name_en || '',
        tagline_km: settings.tagline_km || '',
        tagline_en: settings.tagline_en || '',
        logoUrl: settings.logoUrl || '',
        footer_about_km: settings.footer_about_km || '',
        footer_about_en: settings.footer_about_en || '',
        contact_email: settings.contact_email || '',
        contact_website: settings.contact_website || '',
        heroImageUrl: settings.heroImageUrl || '',
        donateQrUrl: settings.donateQrUrl || '',
        donate_text_km: settings.donate_text_km || '',
        donate_text_en: settings.donate_text_en || '',
        ai_provider: settings.ai_provider || '',
        ai_model: settings.ai_model || ''
      });
      setLogoPreview(settings.logoUrl || '');
      setBannerPreview(settings.heroImageUrl || '');
      setQrPreview(settings.donateQrUrl || '');
    }
  }, [settings]);

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateCoverImage(file);
    if (!validation.valid) { toast.error(validation.error); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBanner = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateCoverImage(file);
    if (!validation.valid) { toast.error(validation.error); return; }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleQr = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateCoverImage(file);
    if (!validation.valid) { toast.error(validation.error); return; }
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let logoUrl = form.logoUrl;
      if (logoFile) {
        const result = await uploadLogo(logoFile, setUploadProgress);
        logoUrl = result.url;
      }
      let heroImageUrl = form.heroImageUrl;
      if (bannerFile) {
        const result = await uploadBanner(bannerFile, setBannerProgress);
        heroImageUrl = result.url;
      }
      let donateQrUrl = form.donateQrUrl;
      if (qrFile) {
        const result = await uploadQrCode(qrFile, setQrProgress);
        donateQrUrl = result.url;
      }
      await updateSiteSettings({ ...form, logoUrl, heroImageUrl, donateQrUrl });
      await refreshSettings();
      toast.success(t('common.success'));
      setUploadProgress(0);
      setBannerProgress(0);
      setQrProgress(0);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const updateProvider = (val) => setForm(prev => ({ ...prev, ai_provider: val, ai_model: '' }));
  const selectedProvider = AI_PROVIDERS.find(p => p.id === form.ai_provider);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className={`text-2xl font-bold text-surface-900 dark:text-white mb-6 ${lang === 'km' ? 'font-khmer' : ''}`}>
        {t('admin.settings')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            Logo
          </h2>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-surface-300 dark:border-surface-600 shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Image className="w-8 h-8 text-surface-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors bg-surface-50 dark:bg-surface-900">
                <Upload className="w-6 h-6 text-surface-400 mb-1" />
                <span className="text-sm text-surface-500">{logoFile ? logoFile.name : t('admin.coverImage')}</span>
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-surface-500 mt-1">{Math.round(uploadProgress)}%</p>
                </div>
              )}
              <p className="text-xs text-surface-400 mt-2">Recommended: 200x200px, PNG or SVG</p>
            </div>
          </div>
        </div>

        {/* Home Banner */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            Home Banner
          </h2>
          <div className="space-y-4">
            <div className="h-40 rounded-xl bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 overflow-hidden flex items-center justify-center">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
              ) : (
                <Image className="w-8 h-8 text-surface-400" />
              )}
            </div>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors bg-surface-50 dark:bg-surface-900">
              <Upload className="w-5 h-5 text-surface-400 mb-1" />
              <span className="text-sm text-surface-500">{bannerFile ? bannerFile.name : t('admin.coverImage')}</span>
              <input type="file" accept="image/*" onChange={handleBanner} className="hidden" />
            </label>
            {bannerProgress > 0 && bannerProgress < 100 && (
              <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${bannerProgress}%` }} />
              </div>
            )}
            <p className="text-xs text-surface-400">Recommended: 1920x600px or wider, JPG/PNG. Displayed behind the hero section.</p>
          </div>
        </div>

        {/* Donate */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('donate.settingsTitle')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-6">
              <div className="w-40 h-40 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center overflow-hidden border border-surface-200 dark:border-surface-600 shrink-0">
                {qrPreview ? (
                  <img src={qrPreview} alt="Bank QR" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-8 h-8 text-surface-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors bg-surface-50 dark:bg-surface-900">
                  <Upload className="w-6 h-6 text-surface-400 mb-1" />
                  <span className="text-sm text-surface-500">{qrFile ? qrFile.name : t('donate.uploadQr')}</span>
                  <input type="file" accept="image/*" onChange={handleQr} className="hidden" />
                </label>
                {qrProgress > 0 && qrProgress < 100 && (
                  <div className="mt-2">
                    <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${qrProgress}%` }} />
                    </div>
                    <p className="text-xs text-surface-500 mt-1">{Math.round(qrProgress)}%</p>
                  </div>
                )}
                <p className="text-xs text-surface-400 mt-2">{t('donate.qrHint')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>{t('donate.textKm')}</label>
                <textarea value={form.donate_text_km} onChange={(e) => update('donate_text_km', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none font-khmer" />
              </div>
              <div>
                <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>{t('donate.textEn')}</label>
                <textarea value={form.donate_text_en} onChange={(e) => update('donate_text_en', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2 ${lang === 'km' ? 'font-khmer' : ''}`}>
            <Bot className="w-5 h-5 text-primary-600" />
            AI Assistant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Provider</label>
              <select
                value={form.ai_provider}
                onChange={(e) => updateProvider(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white"
              >
                {AI_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.id ? p.label : `${p.label} (try all providers)`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">
                Model {!form.ai_provider && <span className="text-surface-400 font-normal">(choose a provider first)</span>}
              </label>
              <select
                value={form.ai_model}
                onChange={(e) => update('ai_model', e.target.value)}
                disabled={!form.ai_provider}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{form.ai_provider ? 'Auto (provider default)' : '—'}</option>
                {(selectedProvider?.models || []).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-surface-400 mt-3">
            Changes apply live for every visitor. NVIDIA NIM models (mistralai/mistral-nemotron, openai/gpt-oss-20b) require VITE_NVIDIA_API_KEY from build.nvidia.com; OpenRouter requires VITE_OPENROUTER_API_KEY. If the selected model fails, the assistant automatically falls back to other available providers.
          </p>
        </div>

        {/* Names */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('admin.bookTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Name (Khmer)</label>
              <input type="text" value={form.name_km} onChange={(e) => update('name_km', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white font-khmer" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Name (English)</label>
              <input type="text" value={form.name_en} onChange={(e) => update('name_en', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Taglines */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            Tagline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Tagline (Khmer)</label>
              <textarea value={form.tagline_km} onChange={(e) => update('tagline_km', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none font-khmer" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Tagline (English)</label>
              <textarea value={form.tagline_en} onChange={(e) => update('tagline_en', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            Footer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">About Text (Khmer)</label>
              <textarea value={form.footer_about_km} onChange={(e) => update('footer_about_km', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none font-khmer" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">About Text (English)</label>
              <textarea value={form.footer_about_en} onChange={(e) => update('footer_about_en', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Contact Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} placeholder="info@example.com" className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Website URL</label>
              <input type="text" value={form.contact_website} onChange={(e) => update('contact_website', e.target.value)} placeholder="example.com" className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="submit" loading={saving} icon={Save}>{t('admin.save')}</Button>
        </div>
      </form>
    </div>
  );
}
