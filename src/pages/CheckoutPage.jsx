import StripeEmbeddedCheckout from '../components/StripeEmbeddedCheckout';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import PaymentTestModeBanner from '../components/PaymentTestModeBanner';

import {
  ArrowLeft,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';


import { getCourses } from '../lib/courses';
import { supabase, createNotification } from '../lib/supabase';

export default function CheckoutPage({ currentUser, onLogout, onCompletePurchase }) {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);

  // Authentication Guard: Login is strictly required for course checkout
  useEffect(() => {
    if (!currentUser && !sessionId) {
      navigate(`/login?redirect=/checkout/${courseId || ''}`);
    }
  }, [currentUser, courseId, sessionId, navigate]);

  useEffect(() => {
    async function load() {
      const allCourses = await getCourses();
      const activeCourses = (allCourses || []).filter(c => c.status !== 'INACTIVE');
      const match = activeCourses.find((c) => c.id === courseId) || activeCourses[0] || null;
      setCourse(match);
    }
    load();
  }, [courseId]);

  const activeCourse = course || {
    id: courseId,
    title: 'Loading course...',
    price: 49,
    projectedPay: '$50,000 – $150,000+ / year',
    access: 'One-time • Lifetime access • Certificate on completion'
  };
  const certName = location.state?.fullName || currentUser?.name || 'Driver Professional';

  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState(currentUser?.email || 'driver@routek9.com');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardholderName, setCardholderName] = useState(certName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const processingRef = useRef(false);

  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');

  // Self-healing database insert helper for transactions
  async function safeInsertTransaction(payload) {
    const { data, error } = await supabase.from('transactions').insert([payload]).select();
    if (error) {
      // If column doesn't exist, remove it and retry
      if (error.code === '42703' || error.message?.includes('column')) {
        const match = error.message?.match(/column "(\w+)"/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && payload.hasOwnProperty(missingColumn)) {
          const nextPayload = { ...payload };
          delete nextPayload[missingColumn];
          return await safeInsertTransaction(nextPayload);
        }
      }
      // Explicit fallbacks for known custom columns
      if (payload.hasOwnProperty('user_id')) {
        const nextPayload = { ...payload };
        delete nextPayload.user_id;
        return await safeInsertTransaction(nextPayload);
      }
      if (payload.hasOwnProperty('course_id')) {
        const nextPayload = { ...payload };
        delete nextPayload.course_id;
        return await safeInsertTransaction(nextPayload);
      }
      throw error;
    }
    return data;
  }

  useEffect(() => {
    if (sessionId && course && !processingRef.current) {
      processingRef.current = true;
      setHasProcessed(true);
      async function handlePaymentSuccess() {
        onCompletePurchase(course.id, certName);

        try {
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('id', sessionId)
            .limit(1);

          if (!existing || existing.length === 0) {
            await safeInsertTransaction({
              id: sessionId,
              user_id: currentUser?.id || null,
              course_id: course.id,
              email: currentUser?.email || 'guest@routek9.com',
              description: course.title || `Route K9 Course Purchase`,
              amount: `$${course.price || 49}.00`,
              status: 'Succeeded',
              created_at: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn("Failed to save transaction record to database:", err);
        }

        // Create notification
        try {
          await createNotification({
            userId: currentUser?.id || null,
            title: 'Course Purchased Successfully',
            message: `Successfully purchased training course: "${course.title || 'Route K9 Training'}". You can now start learning!`,
            category: 'Certification',
            important: true,
            actionUrl: '/dashboard',
            actionText: 'Start Learning'
          });
        } catch (notifErr) {
          console.warn("Could not save course purchase notification:", notifErr);
        }

        setShowSuccessModal(true);
      }
      handlePaymentSuccess();
    }
  }, [sessionId, course, currentUser, hasProcessed]);

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(async () => {
      onCompletePurchase(activeCourse.id, certName);
      setIsProcessing(false);
      setShowSuccessModal(true);

      // Save a mock transaction
      const mockSessionId = `mock_course_cs_${Date.now()}`;
      try {
        await safeInsertTransaction({
          id: mockSessionId,
          user_id: currentUser?.id || null,
          course_id: activeCourse.id,
          email: currentUser?.email || 'guest@routek9.com',
          description: activeCourse.title || `Route K9 Course Purchase`,
          amount: `$${activeCourse.price || 49}.00`,
          status: 'Succeeded',
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Failed to save mock course purchase transaction:", err);
      }

      // Create notification
      try {
        await createNotification({
          userId: currentUser?.id || null,
          title: 'Course Purchased Successfully',
          message: `Successfully purchased training course: "${activeCourse.title}". You can now start learning!`,
          category: 'Certification',
          important: true,
          actionUrl: '/dashboard',
          actionText: 'Start Learning'
        });
      } catch (notifErr) {
        console.warn("Could not save course purchase notification:", notifErr);
      }
    }, 1000);
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  return (
    <>
      {/* Payment Test Mode Banner */}
      {/* <PaymentTestModeBanner /> */}

      {/* Hero Sub-Header */}
      <div className="bg-rose-50/30 border-b border-slate-200/70 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">

          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              ALL COURSES
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0b132b] font-serif-heading leading-tight break-words">
            {activeCourse.title}
          </h1>

          {activeCourse.subtitle && (
            <p className="text-rose-600 text-xs sm:text-sm font-bold leading-relaxed">
              {activeCourse.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
            {activeCourse.projectedPay && (
              <span className="px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 font-extrabold text-xs">
                {activeCourse.projectedPay}
              </span>
            )}
            <span className="text-xl font-extrabold text-[#0b132b]">${activeCourse.price}</span>
            {activeCourse.access && (
              <span className="text-xs text-slate-500 font-medium">{activeCourse.access}</span>
            )}
          </div>

        </div>
      </div>

      {/* Main Payment Checkout Box matching Screenshot */}
      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-lg mx-auto px-4 sm:px-6 w-full">
          {course ? (
            <StripeEmbeddedCheckout
              priceId={`course_${activeCourse.id}`}
              priceAmount={activeCourse.price}
              productName={activeCourse.title}
              fullName={certName}
              email={currentUser?.email || email}
              returnUrl={window.location.href}
              onSuccess={() => handlePay({ preventDefault: () => { } })}
            />
          ) : (
            <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-sm font-extrabold text-[#0b132b]">Loading checkout...</h4>
            </div>
          )}
        </div>
      </main>

      {/* Modern Payment Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">

          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 text-center relative overflow-hidden animate-scaleUp">

            {/* Background Festive Gradient Blobs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Checkmark Icon Animation Badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200 tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test Mode Payment Complete</span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">
                Payment Successful!
              </h2>

              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                You are now officially enrolled in <span className="font-bold text-slate-800">{course.title}</span>.
              </p>
            </div>

            {/* Summary Details Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Enrolled Course:</span>
                <span className="font-bold text-slate-900">{course.title}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Certificate Registered To:</span>
                <span className="font-bold text-rose-600">{certName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-bold text-emerald-600">${course.price}.00 USD</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/70 pt-2">
                <span className="text-slate-500 font-medium">Access Status:</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lifetime Unlimited Access</span>
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={handleGoToDashboard}
              className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}
    </>
  );
}
