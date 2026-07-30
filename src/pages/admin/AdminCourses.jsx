import React, { useState, useEffect } from 'react';
import {
  Plus,
  BookOpen,
  DollarSign,
  Trash2,
  Edit,
  CheckCircle2,
  Loader2,
  X,
  Image as ImageIcon,
  Layers,
  Upload
} from 'lucide-react';
import { CourseCard } from './components/AdminComponents';
import { getCourses, createCourse, updateCourse, deleteCourse, DEFAULT_COURSE_IMAGES } from '../../lib/courses';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('49');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newProjectedPay, setNewProjectedPay] = useState('$50,000 – $150,000+ / year');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newOutcomes, setNewOutcomes] = useState(['', '', '']);
  const [newOutline, setNewOutline] = useState([
    { moduleNumber: 1, moduleTitle: 'Foundations & Overview', lessons: ['Lesson 1: Introduction to course concepts', 'Lesson 2: Setting up initial route requirements'] }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Edit Course Form State
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('49');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editProjectedPay, setEditProjectedPay] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editOutcomes, setEditOutcomes] = useState([]);
  const [editOutline, setEditOutline] = useState([]);
  const [updating, setUpdating] = useState(false);

  const PRESET_IMAGES = [
    { label: 'Cargo Van', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Logistics Desk', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Fleet Delivery', url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Notary Documents', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Field Inspector', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Dispatch Center', url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80' },
  ];

  const fetchDynamicCourses = async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDynamicCourses();
  }, []);

  const handleImageFileUpload = (e, setFn) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image file smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFn(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    const outcomes = newOutcomes.filter(o => o.trim() !== '');

    const payload = {
      id: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Professional training course for route couriers.',
      description: newSubtitle.trim() || 'Professional training course for route couriers.',
      price: Number(newPrice) || 49,
      projectedPay: newProjectedPay.trim() || '$50,000 – $150,000+ / year',
      access: 'One-time • Lifetime access • Certificate on completion',
      image: newImageUrl.trim() || PRESET_IMAGES[0].url,
      image_url: newImageUrl.trim() || PRESET_IMAGES[0].url,
      outcomes: outcomes.length ? outcomes : ['Master core route logistics', 'Earn official certificate of completion'],
      outline: newOutline
    };

    const created = await createCourse(payload);

    setCourses(prev => [created || payload, ...prev]);

    // Reset Form
    setNewTitle('');
    setNewPrice('49');
    setNewSubtitle('');
    setNewImageUrl('');
    setNewOutcomes(['', '', '']);
    setNewOutline([
      { moduleNumber: 1, moduleTitle: 'Foundations & Overview', lessons: ['Lesson 1: Introduction to course concepts', 'Lesson 2: Setting up initial route requirements'] }
    ]);
    setSubmitting(false);
    setShowAddModal(false);

    setSuccessMsg(`Course "${payload.title}" created & saved to Supabase!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const openEditModal = (course) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title || '');
    setEditPrice(String(course.price || 49));
    setEditSubtitle(course.subtitle || course.description || '');
    setEditProjectedPay(course.projectedPay || '');
    setEditImageUrl(course.image_url || course.image || DEFAULT_COURSE_IMAGES[course.id] || '');
    setEditOutcomes(course.outcomes && course.outcomes.length ? [...course.outcomes] : ['', '', '']);
    setEditOutline(course.outline && course.outline.length ? [...course.outline] : [
      { moduleNumber: 1, moduleTitle: 'Module 1 Overview', lessons: ['Lesson 1'] }
    ]);
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingCourseId) return;

    setUpdating(true);
    const outcomes = editOutcomes.filter(o => o.trim() !== '');

    const payload = {
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      description: editSubtitle.trim(),
      price: Number(editPrice) || 49,
      projectedPay: editProjectedPay.trim(),
      image: editImageUrl.trim(),
      image_url: editImageUrl.trim(),
      outcomes: outcomes.length ? outcomes : ['Master core route logistics'],
      outline: editOutline
    };

    await updateCourse(editingCourseId, payload);

    setCourses(prev => prev.map(c => c.id === editingCourseId ? { ...c, ...payload } : c));

    setUpdating(false);
    setShowEditModal(false);
    setSuccessMsg(`Course "${payload.title}" updated in Supabase!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    await deleteCourse(id);
    setCourses(prev => prev.filter(c => c.id !== id));

    setSuccessMsg(`Course "${title}" removed from Supabase.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">Courses Management</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create, edit, and manage dynamic training courses with images and syllabus modules ({courses.length} active courses)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
          <span className="text-xs font-bold">Loading courses from Supabase...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const courseImg = course.image_url || course.image || DEFAULT_COURSE_IMAGES[course.id] || PRESET_IMAGES[0].url;

            return (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden flex flex-col justify-between group">
                
                {/* Course Image Header Preview */}
                <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                  <img
                    src={courseImg}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-rose-600 font-extrabold text-xs shadow-md">
                    ${course.price}
                  </div>
                  <div className="absolute bottom-3 left-3 text-white font-extrabold text-sm line-clamp-1 pr-4">
                    {course.title}
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 line-clamp-2">{course.subtitle}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {course.projectedPay}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                        {course.outline ? course.outline.length : 0} Modules
                      </span>
                    </div>
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {course.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(course)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Course</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD NEW COURSE FORM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Create New Course</h3>
                  <p className="text-xs text-slate-400 font-medium">Add a dynamic training course with modules to Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hazardous Materials Courier Certification"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Cover Image: File Upload OR Direct URL OR Presets */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-rose-600" />
                    <span>Course Cover Image</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Upload File or Paste Link</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  
                  {/* Option 1: File Upload */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Option 1: Upload Image File</label>
                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-dashed border-rose-300 hover:border-rose-500 text-rose-600 font-bold text-xs cursor-pointer shadow-xs transition-all hover:bg-rose-50/50">
                      <Upload className="w-4 h-4" />
                      <span>Choose File...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, setNewImageUrl)}
                      />
                    </label>
                  </div>

                  {/* Option 2: Image URL */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Option 2: Direct Image Link URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                </div>

                {/* Option 3: Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Or Pick Preset Image:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewImageUrl(img.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          newImageUrl === img.url
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview */}
                {newImageUrl && (
                  <div className="relative h-28 rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900 group">
                    <img src={newImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                      <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                        Image Preview
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewImageUrl('')}
                        className="text-white hover:text-rose-400 p-1 bg-black/60 hover:bg-black/90 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Price (USD $) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="49"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Projected Pay Range</label>
                  <input
                    type="text"
                    placeholder="$60,000 – $180,000+ / year"
                    value={newProjectedPay}
                    onChange={(e) => setNewProjectedPay(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Subtitle / Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of what drivers will learn in this course..."
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Outcomes List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Key Outcomes (Bullet Points)</label>
                  <button
                    type="button"
                    onClick={() => setNewOutcomes([...newOutcomes, ''])}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    + Add Outcome Bullet
                  </button>
                </div>

                {newOutcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Outcome ${idx + 1}`}
                      value={outcome}
                      onChange={(e) => {
                        const updated = [...newOutcomes];
                        updated[idx] = e.target.value;
                        setNewOutcomes(updated);
                      }}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    />
                    {newOutcomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewOutcomes(newOutcomes.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Syllabus Modules Editor */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-[#0b132b] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-rose-600" />
                    <span>Course Curriculum & Syllabus Modules ({newOutline.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewOutline([...newOutline, { moduleNumber: newOutline.length + 1, moduleTitle: `Module ${newOutline.length + 1}`, lessons: [''] }])}
                    className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    + Add Curriculum Module
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {newOutline.map((mod, mIdx) => (
                    <div key={mIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          Module 0{mIdx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Module Title (e.g. Master Contractor Foundations)"
                          value={mod.moduleTitle}
                          onChange={(e) => {
                            const updated = [...newOutline];
                            updated[mIdx].moduleTitle = e.target.value;
                            setNewOutline(updated);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                        {newOutline.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewOutline(newOutline.filter((_, i) => i !== mIdx))}
                            className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Module"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Lessons List under this Module */}
                      <div className="space-y-1.5 pl-2 border-l-2 border-rose-300">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                          <span>Module Lessons:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newOutline];
                              updated[mIdx].lessons.push('');
                              setNewOutline(updated);
                            }}
                            className="text-rose-600 hover:underline cursor-pointer"
                          >
                            + Add Lesson
                          </button>
                        </div>
                        {mod.lessons.map((lesson, lIdx) => (
                          <div key={lIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={`Lesson ${lIdx + 1}`}
                              value={lesson}
                              onChange={(e) => {
                                const updated = [...newOutline];
                                updated[mIdx].lessons[lIdx] = e.target.value;
                                setNewOutline(updated);
                              }}
                              className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                            />
                            {mod.lessons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...newOutline];
                                  updated[mIdx].lessons = updated[mIdx].lessons.filter((_, i) => i !== lIdx);
                                  setNewOutline(updated);
                                }}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save Course to Supabase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT COURSE FORM */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Edit Course</h3>
                  <p className="text-xs text-slate-400 font-medium">Update course details, image, and syllabus modules in Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Course Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Cover Image: File Upload OR Direct URL OR Presets */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Course Cover Image</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Upload File or Paste Link</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  
                  {/* Option 1: File Upload */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Option 1: Upload Image File</label>
                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-600 font-bold text-xs cursor-pointer shadow-xs transition-all hover:bg-indigo-50/50">
                      <Upload className="w-4 h-4" />
                      <span>Choose File...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, setEditImageUrl)}
                      />
                    </label>
                  </div>

                  {/* Option 2: Image URL */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Option 2: Direct Image Link URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                </div>

                {/* Option 3: Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Or Pick Preset Image:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditImageUrl(img.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          editImageUrl === img.url
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview */}
                {editImageUrl && (
                  <div className="relative h-28 rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900 group">
                    <img src={editImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                      <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                        Image Preview
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="text-white hover:text-indigo-400 p-1 bg-black/60 hover:bg-black/90 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Price (USD $) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Projected Pay Range</label>
                  <input
                    type="text"
                    value={editProjectedPay}
                    onChange={(e) => setEditProjectedPay(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Subtitle / Description</label>
                <textarea
                  rows="2"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Outcomes List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Key Outcomes (Bullet Points)</label>
                  <button
                    type="button"
                    onClick={() => setEditOutcomes([...editOutcomes, ''])}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    + Add Outcome Bullet
                  </button>
                </div>

                {editOutcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Outcome ${idx + 1}`}
                      value={outcome}
                      onChange={(e) => {
                        const updated = [...editOutcomes];
                        updated[idx] = e.target.value;
                        setEditOutcomes(updated);
                      }}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    {editOutcomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEditOutcomes(editOutcomes.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Syllabus Modules Editor */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-[#0b132b] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Course Curriculum & Syllabus Modules ({editOutline.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditOutline([...editOutline, { moduleNumber: editOutline.length + 1, moduleTitle: `Module ${editOutline.length + 1}`, lessons: [''] }])}
                    className="text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    + Add Curriculum Module
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {editOutline.map((mod, mIdx) => (
                    <div key={mIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Module 0{mIdx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Module Title (e.g. Legal Setup & DOT/MC Authority)"
                          value={mod.moduleTitle}
                          onChange={(e) => {
                            const updated = [...editOutline];
                            updated[mIdx].moduleTitle = e.target.value;
                            setEditOutline(updated);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                        {editOutline.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEditOutline(editOutline.filter((_, i) => i !== mIdx))}
                            className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Module"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Lessons List under this Module */}
                      <div className="space-y-1.5 pl-2 border-l-2 border-indigo-300">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                          <span>Module Lessons:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editOutline];
                              if (!updated[mIdx].lessons) updated[mIdx].lessons = [];
                              updated[mIdx].lessons.push('');
                              setEditOutline(updated);
                            }}
                            className="text-indigo-600 hover:underline cursor-pointer"
                          >
                            + Add Lesson
                          </button>
                        </div>
                        {(mod.lessons || []).map((lesson, lIdx) => (
                          <div key={lIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={`Lesson ${lIdx + 1}`}
                              value={lesson}
                              onChange={(e) => {
                                const updated = [...editOutline];
                                updated[mIdx].lessons[lIdx] = e.target.value;
                                setEditOutline(updated);
                              }}
                              className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                            />
                            {(mod.lessons || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editOutline];
                                  updated[mIdx].lessons = updated[mIdx].lessons.filter((_, i) => i !== lIdx);
                                  setEditOutline(updated);
                                }}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                  <span>Update Course in Supabase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
