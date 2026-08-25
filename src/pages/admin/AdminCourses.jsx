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
  Upload,
  ChevronDown
} from 'lucide-react';
import { CourseCard, ConfirmModal } from './components/AdminComponents';
import { getCourses, createCourse, updateCourse, deleteCourse, DEFAULT_COURSE_IMAGES } from '../../lib/courses';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formError, setFormError] = useState(null);

  // Custom Delete Confirm Modal State
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, courseId: null, title: '' });
  const [deleting, setDeleting] = useState(false);

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
  const [newStatus, setNewStatus] = useState('ACTIVE');
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
  const [editStatus, setEditStatus] = useState('ACTIVE');
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

  const handleCourseStatusChange = async (courseId, newStatus, currentCourse) => {
    try {
      // 1. Optimistic update
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus } : c));

      // 2. Save in database
      await updateCourse(courseId, {
        ...currentCourse,
        status: newStatus
      });
    } catch (err) {
      console.warn("Failed to update course status:", err);
    }
  };

  useEffect(() => {
    fetchDynamicCourses();
  }, []);

  const handleAddOutcome = (isEdit = false) => {
    if (isEdit) {
      setEditOutcomes(prev => [...prev, '']);
    } else {
      setNewOutcomes(prev => [...prev, '']);
    }
  };

  const handleOutcomeChange = (index, value, isEdit = false) => {
    if (isEdit) {
      setEditOutcomes(prev => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    } else {
      setNewOutcomes(prev => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    }
  };

  const handleRemoveOutcome = (index, isEdit = false) => {
    if (isEdit) {
      setEditOutcomes(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewOutcomes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddModule = (isEdit = false) => {
    const nextMod = {
      moduleNumber: isEdit ? editOutline.length + 1 : newOutline.length + 1,
      moduleTitle: '',
      lessons: ['']
    };
    if (isEdit) {
      setEditOutline(prev => [...prev, nextMod]);
    } else {
      setNewOutline(prev => [...prev, nextMod]);
    }
  };

  const handleModuleTitleChange = (modIdx, val, isEdit = false) => {
    if (isEdit) {
      setEditOutline(prev => prev.map((m, idx) => idx === modIdx ? { ...m, moduleTitle: val } : m));
    } else {
      setNewOutline(prev => prev.map((m, idx) => idx === modIdx ? { ...m, moduleTitle: val } : m));
    }
  };

  const handleRemoveModule = (modIdx, isEdit = false) => {
    const updateFn = prev => {
      const filtered = prev.filter((_, idx) => idx !== modIdx);
      return filtered.map((m, idx) => ({ ...m, moduleNumber: idx + 1 }));
    };
    if (isEdit) {
      setEditOutline(updateFn);
    } else {
      setNewOutline(updateFn);
    }
  };

  const handleAddLesson = (modIdx, isEdit = false) => {
    if (isEdit) {
      setEditOutline(prev => prev.map((m, idx) => {
        if (idx === modIdx) {
          const currentLessons = Array.isArray(m?.lessons) ? m.lessons : (Array.isArray(m?.steps) ? m.steps : [m?.body || m?.title || '']);
          return { ...m, lessons: [...currentLessons, ''] };
        }
        return m;
      }));
    } else {
      setNewOutline(prev => prev.map((m, idx) => {
        if (idx === modIdx) {
          const currentLessons = Array.isArray(m?.lessons) ? m.lessons : (Array.isArray(m?.steps) ? m.steps : [m?.body || m?.title || '']);
          return { ...m, lessons: [...currentLessons, ''] };
        }
        return m;
      }));
    }
  };

  const handleLessonChange = (modIdx, lesIdx, val, isEdit = false) => {
    if (isEdit) {
      setEditOutline(prev => prev.map((m, idx) => {
        if (idx === modIdx) {
          const currentLessons = Array.isArray(m?.lessons) ? [...m.lessons] : (Array.isArray(m?.steps) ? [...m.steps] : [m?.body || m?.title || '']);
          currentLessons[lesIdx] = val;
          return { ...m, lessons: currentLessons };
        }
        return m;
      }));
    } else {
      setNewOutline(prev => prev.map((m, idx) => {
        if (idx === modIdx) {
          const currentLessons = Array.isArray(m?.lessons) ? [...m.lessons] : (Array.isArray(m?.steps) ? [...m.steps] : [m?.body || m?.title || '']);
          currentLessons[lesIdx] = val;
          return { ...m, lessons: currentLessons };
        }
        return m;
      }));
    }
  };

  const handleRemoveLesson = (modIdx, lesIdx, isEdit = false) => {
    if (isEdit) {
      setEditOutline(prev => prev.map((m, idx) => {
        if (idx === modIdx) {
          const currentLessons = Array.isArray(m?.lessons) ? m.lessons : (Array.isArray(m?.steps) ? m.steps : [m?.body || m?.title || '']);
          return { ...m, lessons: currentLessons.filter((_, li) => li !== lesIdx) };
        }
        return m;
      }));
    } else {
      setNewOutline(prev => prev.map((m, idx) => {
        if (idx === modIdx) {
          const currentLessons = Array.isArray(m?.lessons) ? m.lessons : (Array.isArray(m?.steps) ? m.steps : [m?.body || m?.title || '']);
          return { ...m, lessons: currentLessons.filter((_, li) => li !== lesIdx) };
        }
        return m;
      }));
    }
  };

  const handleImageFileUpload = (e, setFn) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSuccessMsg("Please select an image file smaller than 5MB.");
      setTimeout(() => setSuccessMsg(null), 4000);
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

    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0.50) {
      setFormError("Course price / rate must be at least $0.50 USD.");
      setTimeout(() => setFormError(null), 4000);
      return;
    }

    setSubmitting(true);
    const outcomes = newOutcomes.filter(o => o.trim() !== '');

    const payload = {
      id: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Professional training course for route couriers.',
      description: newSubtitle.trim() || 'Professional training course for route couriers.',
      price: parsedPrice,
      projectedPay: newProjectedPay.trim() || '$50,000 – $150,000+ / year',
      access: 'One-time • Lifetime access • Certificate on completion',
      image: newImageUrl.trim() || PRESET_IMAGES[0].url,
      image_url: newImageUrl.trim() || PRESET_IMAGES[0].url,
      outcomes: outcomes.length ? outcomes : ['Master core route logistics', 'Earn official certificate of completion'],
      outline: newOutline,
      status: newStatus
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
    setNewStatus('ACTIVE');
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

    const rawOutline = course.outline || course.lessons || [];
    const normalizedOutline = rawOutline.map((mod, idx) => {
      if (typeof mod === 'string') {
        return { moduleNumber: idx + 1, moduleTitle: mod, lessons: [mod] };
      }
      const lessonsList = Array.isArray(mod?.lessons)
        ? mod.lessons
        : (Array.isArray(mod?.steps) ? mod.steps : [mod?.body || mod?.title || 'Lesson 1']);

      return {
        ...mod,
        moduleNumber: mod?.moduleNumber || idx + 1,
        moduleTitle: mod?.moduleTitle || mod?.title || `Module ${idx + 1}`,
        lessons: lessonsList
      };
    });

    setEditOutline(normalizedOutline.length ? normalizedOutline : [
      { moduleNumber: 1, moduleTitle: 'Module 1 Overview', lessons: ['Lesson 1'] }
    ]);
    setEditStatus(course.status || 'ACTIVE');
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingCourseId) return;

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0.50) {
      setFormError("Course price / rate must be at least $0.50 USD.");
      setTimeout(() => setFormError(null), 4000);
      return;
    }

    setUpdating(true);
    const outcomes = editOutcomes.filter(o => o.trim() !== '');

    const payload = {
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      description: editSubtitle.trim(),
      price: parsedPrice,
      projectedPay: editProjectedPay.trim(),
      image: editImageUrl.trim(),
      image_url: editImageUrl.trim(),
      outcomes: outcomes.length ? outcomes : ['Master core route logistics'],
      outline: editOutline,
      status: editStatus
    };

    await updateCourse(editingCourseId, payload);

    setCourses(prev => prev.map(c => c.id === editingCourseId ? { ...c, ...payload } : c));

    setUpdating(false);
    setShowEditModal(false);
    setSuccessMsg(`Course "${payload.title}" updated in Supabase!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const promptDeleteCourse = (id, title) => {
    setDeleteModalState({ isOpen: true, courseId: id, title });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModalState.courseId) return;
    setDeleting(true);
    await deleteCourse(deleteModalState.courseId);
    setCourses(prev => prev.filter(c => c.id !== deleteModalState.courseId));
    setDeleting(false);
    setSuccessMsg(`Course "${deleteModalState.title}" removed from Supabase.`);
    setDeleteModalState({ isOpen: false, courseId: null, title: '' });
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
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

                    <div className="mt-2.5 pt-2 border-t border-slate-100/50 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Course Status
                      </span>
                      <div className="relative">
                        <select
                          value={course.status || 'ACTIVE'}
                          onChange={(e) => handleCourseStatusChange(course.id, e.target.value, course)}
                          className={`appearance-none pl-3 pr-7 py-0.5 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none transition-all ${course.status === 'INACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            }`}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                      </div>
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
                        onClick={() => promptDeleteCourse(course.id, course.title)}
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
              <div>
                <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Create New Training Course</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Add a new course module with image, pricing, and curriculum syllabus</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fadeIn">
                  ⚠️ {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Contractor Certification"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-rose-600" />
                    <span>Course Cover Image</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Upload File or Paste Link</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
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

                {/* Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Or Pick Preset Image:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${!newImageUrl
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                    >
                      Clear Selection
                    </button>
                    {PRESET_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewImageUrl(newImageUrl === img.url ? '' : img.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${newImageUrl === img.url
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Price (USD $) *</label>
                  <input
                    type="number"
                    required
                    min="0.50"
                    step="0.01"
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

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700">Subtitle / Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of what drivers will learn in this course..."
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* outcomes Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    What You'll Be Able to Do (Outcomes)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddOutcome(false)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[10px] rounded-lg border border-rose-200 cursor-pointer"
                  >
                    + Add Outcome
                  </button>
                </div>
                <div className="space-y-2">
                  {newOutcomes.map((outcome, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Outcome #${oIdx + 1}`}
                        value={outcome}
                        onChange={(e) => handleOutcomeChange(oIdx, e.target.value, false)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                      {newOutcomes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOutcome(oIdx, false)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outline / Syllabus Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Course Outline & Syllabus Modules
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddModule(false)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[10px] rounded-lg border border-rose-200 cursor-pointer"
                  >
                    + Add Module
                  </button>
                </div>
                <div className="space-y-4">
                  {newOutline.map((mod, mIdx) => (
                    <div key={mIdx} className="p-4 rounded-xl bg-white border border-slate-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          Module {mod.moduleNumber || mIdx + 1}
                        </span>
                        {newOutline.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(mIdx, false)}
                            className="text-slate-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer"
                          >
                            Remove Module
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Module Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Setting up USDOT & Authority"
                          value={mod.moduleTitle}
                          onChange={(e) => handleModuleTitleChange(mIdx, e.target.value, false)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Lessons</label>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mIdx, false)}
                            className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                          >
                            + Add Lesson
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {(Array.isArray(mod?.lessons) ? mod.lessons : (Array.isArray(mod?.steps) ? mod.steps : [mod?.body || mod?.title || 'Lesson 1'])).map((lesson, lIdx) => (
                            <div key={lIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                required
                                placeholder={`Lesson #${lIdx + 1}`}
                                value={typeof lesson === 'string' ? lesson : (lesson?.title || lesson?.body || '')}
                                onChange={(e) => handleLessonChange(mIdx, lIdx, e.target.value, false)}
                                className="flex-1 px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                              />
                              {(Array.isArray(mod?.lessons) ? mod.lessons : (Array.isArray(mod?.steps) ? mod.steps : [mod?.body || mod?.title || 'Lesson 1'])).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLesson(mIdx, lIdx, false)}
                                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
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
              <div>
                <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Edit Course</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Modify pricing, image cover, or curriculum syllabus</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fadeIn">
                  ⚠️ {formError}
                </div>
              )}

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

              {/* Cover Image */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Course Cover Image</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Upload File or Paste Link</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
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

                {/* Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Or Pick Preset Image:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${!editImageUrl
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                    >
                      Clear Selection
                    </button>
                    {PRESET_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditImageUrl(editImageUrl === img.url ? '' : img.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${editImageUrl === img.url
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

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
                        className="text-white hover:text-rose-400 p-1 bg-black/60 hover:bg-black/90 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Price (USD $) *</label>
                  <input
                    type="number"
                    required
                    min="0.50"
                    step="0.01"
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

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Course Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700">Subtitle / Description</label>
                <textarea
                  rows="2"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Outcomes Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    What You'll Be Able to Do (Outcomes)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddOutcome(true)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    + Add Outcome
                  </button>
                </div>
                <div className="space-y-2">
                  {editOutcomes.map((outcome, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Outcome #${oIdx + 1}`}
                        value={outcome}
                        onChange={(e) => handleOutcomeChange(oIdx, e.target.value, true)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      {editOutcomes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOutcome(oIdx, true)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outline / Syllabus Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Course Outline & Syllabus Modules
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddModule(true)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    + Add Module
                  </button>
                </div>
                <div className="space-y-4">
                  {editOutline.map((mod, mIdx) => (
                    <div key={mIdx} className="p-4 rounded-xl bg-white border border-slate-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          Module {mod.moduleNumber || mIdx + 1}
                        </span>
                        {editOutline.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(mIdx, true)}
                            className="text-slate-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer"
                          >
                            Remove Module
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Module Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Setting up USDOT & Authority"
                          value={mod.moduleTitle}
                          onChange={(e) => handleModuleTitleChange(mIdx, e.target.value, true)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Lessons</label>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mIdx, true)}
                            className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                          >
                            + Add Lesson
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {(Array.isArray(mod?.lessons) ? mod.lessons : (Array.isArray(mod?.steps) ? mod.steps : [mod?.body || mod?.title || 'Lesson 1'])).map((lesson, lIdx) => (
                            <div key={lIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                required
                                placeholder={`Lesson #${lIdx + 1}`}
                                value={typeof lesson === 'string' ? lesson : (lesson?.title || lesson?.body || '')}
                                onChange={(e) => handleLessonChange(mIdx, lIdx, e.target.value, true)}
                                className="flex-1 px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              />
                              {(Array.isArray(mod?.lessons) ? mod.lessons : (Array.isArray(mod?.steps) ? mod.steps : [mod?.body || mod?.title || 'Lesson 1'])).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLesson(mIdx, lIdx, true)}
                                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
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

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, courseId: null, title: '' })}
        onConfirm={handleExecuteDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteModalState.title}"? This will permanently remove it from Supabase.`}
        confirmText="Delete Course"
        confirmColor="rose"
        loading={deleting}
      />
    </div>
  );
}
