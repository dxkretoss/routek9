import StripeEmbeddedCheckout from '../components/StripeEmbeddedCheckout';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import PaymentTestModeBanner from '../components/PaymentTestModeBanner';
import { COURSES_DATA } from '../data/coursesData';
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
import { useState, useEffect } from 'react';


import { getCourses } from '../lib/courses';

export default function CheckoutPage({ currentUser, onLogout, onCompletePurchase }) {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);

  useEffect(() => {
    async function load() {
      const allCourses = await getCourses();
      const match = allCourses.find((c) => c.id === courseId) || allCourses[0] || COURSES_DATA[0];
      setCourse(match);
    }
    load();
  }, [courseId]);

  const activeCourse = course || COURSES_DATA.find((c) => c.id === courseId) || COURSES_DATA[0];
  const certName = location.state?.fullName || currentUser?.name || 'Driver Professional';

  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState(currentUser?.email || 'driver@routek9.com');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardholderName, setCardholderName] = useState(certName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      onCompletePurchase(activeCourse.id, certName);
      setIsProcessing(false);
      setShowSuccessModal(true);
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

      {/* Hero Sub-Header matching Screenshot 3 */}
      <div className="bg-rose-50/30 border-b border-slate-200/70 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">

          <Link
            to={`/training/${activeCourse.id}`}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 inline-flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to course</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              ALL COURSES
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b132b] font-serif-heading">
            {activeCourse.title}
          </h1>

          <p className="text-rose-600 text-xs sm:text-sm font-bold">
            {activeCourse.subtitle}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <span className="px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 font-extrabold text-xs">
              {activeCourse.projectedPay}
            </span>
            <span className="text-xl font-extrabold text-[#0b132b]">${activeCourse.price}</span>
            <span className="text-xs text-slate-500 font-medium">{activeCourse.access}</span>
          </div>

        </div>
      </div>

      {/* Main Payment Checkout Box matching Screenshot */}
      <main className="flex-1 py-10">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <StripeEmbeddedCheckout
            priceId={`course_${activeCourse.id}`}
            fullName={certName}
            returnUrl={window.location.href}
            onSuccess={() => handlePay({ preventDefault: () => { } })}
          />
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
