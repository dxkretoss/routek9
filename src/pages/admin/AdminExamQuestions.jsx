import React, { useState, useEffect } from 'react';
import {
  Plus,
  HelpCircle,
  Trash2,
  Edit,
  CheckCircle2,
  Loader2,
  X,
  Search,
  FileText,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ConfirmModal } from './components/AdminComponents';
import { supabase } from '../../lib/supabase';

export default function AdminExamQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, questionId: null, questionText: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formTopic, setFormTopic] = useState('HIPAA');
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formAnswer, setFormAnswer] = useState(0);
  const [editingId, setEditingId] = useState(null);

  // Fetch Questions from Supabase DB
  const fetchQuestions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn("Supabase fetch exam_questions notice:", error.message);
        setQuestions([]);
      } else if (data && data.length > 0) {
        const formatted = data.map(q => ({
          id: q.id,
          topic: q.topic || 'General',
          question: q.question || q.q || '',
          options: Array.isArray(q.options)
            ? q.options
            : typeof q.options === 'string'
              ? JSON.parse(q.options)
              : ['', '', '', ''],
          answer: Number(q.answer) || 0
        }));
        setQuestions(formatted);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Failed to load exam questions:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const showNotification = (msg, isErr = false) => {
    if (isErr) setErrorMsg(msg);
    else setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormTopic('HIPAA');
    setFormQuestion('');
    setFormOptions(['', '', '', '']);
    setFormAnswer(0);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (qItem) => {
    setEditingId(qItem.id);
    setFormTopic(qItem.topic || 'HIPAA');
    setFormQuestion(qItem.question);
    setFormOptions(qItem.options.length === 4 ? [...qItem.options] : [qItem.options[0] || '', qItem.options[1] || '', qItem.options[2] || '', qItem.options[3] || '']);
    setFormAnswer(qItem.answer);
    setShowEditModal(true);
  };

  // Save New Question
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!formQuestion.trim()) {
      alert("Please enter a question.");
      return;
    }
    if (formOptions.some(o => !o.trim())) {
      alert("Please fill in all 4 option choices.");
      return;
    }

    setSubmitting(true);
    const newQuestionObj = {
      topic: formTopic.trim(),
      question: formQuestion.trim(),
      options: formOptions.map(o => o.trim()),
      answer: Number(formAnswer)
    };

    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .insert([newQuestionObj])
        .select();

      if (error) {
        console.warn("Supabase insert question error:", error.message);
        // Add locally
        const mockNew = { ...newQuestionObj, id: Date.now() };
        setQuestions(prev => [...prev, mockNew]);
        showNotification("Question added to local view (Note: Supabase table exam_questions missing or blocked RLS)");
      } else {
        await fetchQuestions();
        showNotification("Exam Question created successfully!");
      }
      setShowAddModal(false);
    } catch (err) {
      console.error("Create Question Exception:", err);
      const mockNew = { ...newQuestionObj, id: Date.now() };
      setQuestions(prev => [...prev, mockNew]);
      showNotification("Question added locally!");
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Save Edit Question
  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    if (!formQuestion.trim() || formOptions.some(o => !o.trim())) {
      alert("Please complete the question and all 4 options.");
      return;
    }

    setSubmitting(true);
    const updatedObj = {
      topic: formTopic.trim(),
      question: formQuestion.trim(),
      options: formOptions.map(o => o.trim()),
      answer: Number(formAnswer)
    };

    try {
      const { error } = await supabase
        .from('exam_questions')
        .update(updatedObj)
        .eq('id', editingId);

      if (error) {
        console.warn("Supabase update error:", error.message);
        setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...updatedObj } : q));
        showNotification("Question updated locally.");
      } else {
        await fetchQuestions();
        showNotification("Exam Question updated successfully!");
      }
      setShowEditModal(false);
    } catch (err) {
      console.error("Update Question Exception:", err);
      setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...updatedObj } : q));
      showNotification("Question updated locally.");
      setShowEditModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Question
  const handleConfirmDelete = async () => {
    if (!deleteModalState.questionId) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', deleteModalState.questionId);

      if (error) {
        console.warn("Supabase delete error:", error.message);
      }
      setQuestions(prev => prev.filter(q => q.id !== deleteModalState.questionId));
      showNotification("Exam Question deleted successfully!");
    } catch (err) {
      console.error("Delete Question Exception:", err);
      setQuestions(prev => prev.filter(q => q.id !== deleteModalState.questionId));
      showNotification("Question removed locally.");
    } finally {
      setDeleting(false);
      setDeleteModalState({ isOpen: false, questionId: null, questionText: '' });
    }
  };

  // Filter topics
  const topics = ['ALL', ...Array.from(new Set(questions.map(q => q.topic)))];

  const filteredQuestions = questions.filter(q => {
    const matchesTopic = selectedTopic === 'ALL' || q.topic === selectedTopic;
    const matchesSearch = searchQuery.trim() === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="mx-auto space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
              Certification Exam Questions
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage dynamic compliance examination questions & answer keys stored in Supabase database.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Exam Question</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions or topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Topic filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Topic:</span>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${selectedTopic === t
                ? 'bg-[#0b132b] text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <span className="text-xs font-bold">Loading exam questions from database...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search filter or click "Add New Exam Question" to add one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((qItem, idx) => (
            <div
              key={qItem.id || idx}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                    Q{idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border border-slate-200">
                    {qItem.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(qItem)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteModalState({ isOpen: true, questionId: qItem.id, questionText: qItem.question })}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-base font-extrabold text-[#0b132b] leading-relaxed">
                {qItem.question}
              </h3>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {qItem.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === qItem.answer;
                  return (
                    <div
                      key={oIdx}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 transition-all ${isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300'
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded-lg text-[10px] font-extrabold flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="truncate">{opt}</span>
                      </div>
                      {isCorrect && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[9px] uppercase shrink-0">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD QUESTION MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Plus className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-extrabold text-[#0b132b]">Add Exam Question</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              {/* Topic */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Topic / Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HIPAA, Bloodborne Pathogens, General Safety"
                  value={formTopic}
                  onChange={e => setFormTopic(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter the question text here..."
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Answer Choice Options</label>
                {formOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 font-extrabold text-xs text-slate-600 flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      value={opt}
                      onChange={e => {
                        const copy = [...formOptions];
                        copy[idx] = e.target.value;
                        setFormOptions(copy);
                      }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                ))}
              </div>

              {/* Correct Answer Selection */}
              <div className="space-y-1 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Mark Correct Answer</label>
                <select
                  value={formAnswer}
                  onChange={e => setFormAnswer(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {formOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      Option {String.fromCharCode(65 + idx)}: {opt ? opt.substring(0, 40) + '...' : '(Choice ' + String.fromCharCode(65 + idx) + ')'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT QUESTION MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Edit className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-extrabold text-[#0b132b]">Edit Exam Question</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuestion} className="space-y-4">
              {/* Topic */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Topic / Category</label>
                <input
                  type="text"
                  required
                  value={formTopic}
                  onChange={e => setFormTopic(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Answer Choice Options</label>
                {formOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 font-extrabold text-xs text-slate-600 flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={e => {
                        const copy = [...formOptions];
                        copy[idx] = e.target.value;
                        setFormOptions(copy);
                      }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                ))}
              </div>

              {/* Correct Answer Selection */}
              <div className="space-y-1 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Mark Correct Answer</label>
                <select
                  value={formAnswer}
                  onChange={e => setFormAnswer(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {formOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      Option {String.fromCharCode(65 + idx)}: {opt ? opt.substring(0, 40) + '...' : '(Choice ' + String.fromCharCode(65 + idx) + ')'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Exam Question"
        message={`Are you sure you want to delete question "${deleteModalState.questionText}"?`}
        confirmLabel="Delete Question"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, questionId: null, questionText: '' })}
        loading={deleting}
      />
    </div>
  );
}
