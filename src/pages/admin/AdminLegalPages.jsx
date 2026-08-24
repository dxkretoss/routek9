import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Save, CheckCircle2, AlertCircle, Loader2, Eye, Edit3, RefreshCw, ArrowLeft, Plus, ExternalLink, Globe } from 'lucide-react';
import JoditEditor from 'jodit-react';
import { supabase } from '../../lib/supabase';

export default function AdminLegalPages() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'editor'
  const [pagesList, setPagesList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Editor State
  const [editingSlug, setEditingSlug] = useState('terms');
  const [title, setTitle] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [isNewPage, setIsNewPage] = useState(false);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }
  const [previewMode, setPreviewMode] = useState(false);

  const editorRef = useRef(null);

  // Jodit Editor Configuration
  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing legal page HTML content...',
    height: 500,
    theme: 'default',
    toolbarButtonSize: 'small',
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    showXPathInStatusbar: false
  }), []);

  // Default seed system pages
  const defaultPages = [
    {
      slug: 'terms',
      name: 'Terms & Conditions',
      title: 'Terms & Conditions',
      content_html: `<h2>1. Acceptance of Terms</h2><p>Welcome to RouteK9. By using our platform, you agree to these Terms...</p><h2>2. Independent Contractor Relationship</h2><p>Drivers operate strictly as 1099 Independent Contractors...</p>`,
      updated_at: new Date().toISOString()
    },
    {
      slug: 'privacy',
      name: 'Privacy Policy',
      title: 'Privacy Policy',
      content_html: `<h2>1. Information We Collect</h2><p>RouteK9 respects your privacy. We collect profile data necessary for logistics matching...</p><h2>2. Directory Visibility</h2><p>You can manage profile visibility settings anytime in your profile settings...</p>`,
      updated_at: new Date().toISOString()
    }
  ];

  // Fetch all legal pages from Supabase
  const loadAllPages = async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn("Supabase fetch notice:", error);
      }

      if (data && Array.isArray(data) && data.length > 0) {
        // Merge with defaults if system pages missing
        const existingSlugs = new Set(data.map(p => p.slug));
        const merged = [...data];
        defaultPages.forEach(def => {
          if (!existingSlugs.has(def.slug)) {
            merged.push(def);
          }
        });
        setPagesList(merged);
      } else {
        setPagesList(defaultPages);
      }
    } catch (err) {
      console.error("Error loading legal pages list:", err);
      setPagesList(defaultPages);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAllPages();
  }, []);

  // Open Editor View for a specific page
  const handleOpenEditor = async (pageItem) => {
    setStatusMsg(null);
    setIsNewPage(false);
    setEditingSlug(pageItem.slug);
    setSlugInput(pageItem.slug);
    setTitle(pageItem.title || pageItem.name || '');
    setPreviewMode(false);
    setViewMode('editor');
    setLoadingEditor(true);

    try {
      const { data } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('slug', pageItem.slug)
        .maybeSingle();

      if (data && data.content_html) {
        setTitle(data.title || pageItem.title);
        setContentHtml(data.content_html);
      } else {
        setContentHtml(pageItem.content_html || '');
      }
    } catch (err) {
      console.warn("Notice fetching specific page content:", err);
      setContentHtml(pageItem.content_html || '');
    } finally {
      setLoadingEditor(false);
    }
  };

  // Open Editor for Creating a New Page
  const handleCreateNewPage = () => {
    setStatusMsg(null);
    setIsNewPage(true);
    setEditingSlug('');
    setSlugInput('');
    setTitle('');
    setContentHtml('<h2>Page Heading</h2><p>Type your content here...</p>');
    setPreviewMode(false);
    setViewMode('editor');
  };

  // Save changes to Supabase legal_pages table
  const handleSavePage = async () => {
    const finalSlug = (isNewPage ? slugInput : editingSlug).trim().toLowerCase().replace(/\s+/g, '-');
    if (!finalSlug) {
      setStatusMsg({ type: 'error', text: 'URL Slug is required (e.g. refund-policy).' });
      return;
    }
    if (!title.trim()) {
      setStatusMsg({ type: 'error', text: 'Page Header Title is required.' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        slug: finalSlug,
        title: title.trim(),
        content_html: contentHtml,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('legal_pages')
        .upsert(payload, { onConflict: 'slug' });

      if (error) throw error;

      setStatusMsg({ type: 'success', text: `Successfully saved and published "${title}" to database!` });
      setIsNewPage(false);
      setEditingSlug(finalSlug);
      loadAllPages();
    } catch (err) {
      console.error("Error saving legal page:", err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save page to database.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View 1: Legal Pages Directory Listing */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Top Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-rose-600" />
                <span>Legal Pages Management (CMS)</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage, edit, & publish HTML legal documents rendered across Web and Mobile apps
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAllPages}
                disabled={loadingList}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>

              <button
                onClick={handleCreateNewPage}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Page</span>
              </button>
            </div>
          </div>

          {/* Directory Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Active Legal Documents</h3>
                <p className="text-xs text-slate-400 font-medium">Click "Edit Page" to launch the Jodit Editor</p>
              </div>
              <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
                {pagesList.length} Pages Configured
              </span>
            </div>

            {loadingList ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading Legal Pages Directory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Page Name</th>
                      <th className="px-6 py-4">URL Slug</th>
                      <th className="px-6 py-4">Header Title</th>
                      <th className="px-6 py-4">Last Updated</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {pagesList.map((page, idx) => {
                      const formattedDate = page.updated_at
                        ? new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Default System';

                      const publicUrl = page.slug === 'terms' ? '/terms' : page.slug === 'privacy' ? '/privacy' : `/${page.slug}`;

                      return (
                        <tr key={page.slug || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-extrabold flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900">
                                  {page.name || page.title || page.slug}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  Supabase Table Record
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono font-bold text-rose-600">
                            /{page.slug}
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-700">
                            {page.title || 'Legal Document'}
                          </td>

                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {formattedDate}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                <span>Preview Live</span>
                              </a>

                              <button
                                onClick={() => handleOpenEditor(page)}
                                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Page</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* View 2: Page Editor View (Jodit WYSIWYG Editor) */
        <div className="space-y-6">
          {/* Editor Header Banner with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                title="Back to Pages List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
                  {isNewPage ? 'Create New Legal Page' : `Editing: ${title || editingSlug}`}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  URL Route: <span className="font-mono text-rose-600 font-bold">/{slugInput || editingSlug}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${!previewMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${previewMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>

              <button
                onClick={handleSavePage}
                disabled={saving || loadingEditor}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
              </button>
            </div>
          </div>

          {/* Alert Status Banner */}
          {statusMsg && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
              <button onClick={() => setStatusMsg(null)} className="text-current underline cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* Main Editor Card */}
          {loadingEditor ? (
            <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading Page Content...</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-6">

              {/* Title & Slug Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Header Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Terms & Conditions"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={isNewPage ? slugInput : editingSlug}
                    onChange={(e) => setSlugInput(e.target.value)}
                    disabled={!isNewPage}
                    placeholder="e.g. terms or refund-policy"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Jodit Editor or Live Preview */}
              {!previewMode ? (
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Jodit WYSIWYG Content Editor
                  </label>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <JoditEditor
                      ref={editorRef}
                      value={contentHtml}
                      config={editorConfig}
                      onBlur={(newContent) => setContentHtml(newContent)}
                      onChange={() => {}}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Live Render Preview
                  </label>
                  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 min-h-[400px]">
                    <div
                      className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: contentHtml || '<p className="text-slate-400 italic">No content entered yet.</p>' }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Directory</span>
                </button>

                <button
                  onClick={handleSavePage}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Publishing Changes...' : 'Save & Publish to Supabase'}</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
