import { supabase } from './supabase';
import { COURSES_DATA } from '../data/coursesData';

export const DEFAULT_COURSE_IMAGES = {
  "master-contractor": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
  "logistics-consultant": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
  "delivery-company": "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1600&q=80",
  "notary-public": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&q=80",
  "field-inspector": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
  "courier-dispatcher": "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80"
};

// Helper to seed initial default courses into Supabase if table is empty (0 rows)
export async function seedDefaultCourses() {
  try {
    const seedPayloads = COURSES_DATA.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description || c.subtitle,
      price: c.price || 49,
      projected_pay: c.projectedPay || "$50,000 – $150,000+ / year",
      access: c.access || "One-time • Lifetime access • Certificate on completion",
      image_url: DEFAULT_COURSE_IMAGES[c.id] || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
      outcomes: c.outcomes || [],
      outline: c.outline || [],
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('courses')
      .upsert(seedPayloads, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Could not auto-seed courses to Supabase:', error.message);
      return COURSES_DATA;
    }

    return (data && data.length) ? data.map((c, index) => formatCourse(c, index)) : COURSES_DATA;
  } catch (err) {
    console.error('Error seeding courses:', err);
    return COURSES_DATA;
  }
}

// Format DB record to course object
function formatCourse(c, index) {
  const imageUrl = c.image_url || c.image || DEFAULT_COURSE_IMAGES[c.id] || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80";

  return {
    id: c.id || `c-${index + 1}`,
    number: index + 1,
    title: c.title,
    subtitle: c.subtitle || c.description,
    description: c.description || c.subtitle,
    price: c.price || 49,
    projectedPay: c.projected_pay || c.projectedPay || "$50,000 – $150,000+ / year",
    access: c.access || "One-time • Lifetime access • Certificate on completion",
    image: imageUrl,
    image_url: imageUrl,
    outcomes: Array.isArray(c.outcomes) ? c.outcomes : (typeof c.outcomes === 'string' ? JSON.parse(c.outcomes) : []),
    outline: Array.isArray(c.outline) ? c.outline : (typeof c.outline === 'string' ? JSON.parse(c.outline) : []),
    created_at: c.created_at
  };
}

// Helper to get all courses from Supabase
export async function getCourses() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase query error for courses:', error.message);
      return COURSES_DATA.map((c, idx) => ({
        ...c,
        image: DEFAULT_COURSE_IMAGES[c.id],
        image_url: DEFAULT_COURSE_IMAGES[c.id]
      }));
    }

    // If database table exists but has 0 rows, seed initial courses automatically
    if (!data || data.length === 0) {
      console.log('Courses table has 0 rows. Seeding default courses to Supabase...');
      return await seedDefaultCourses();
    }

    return data.map((c, index) => formatCourse(c, index));
  } catch (err) {
    console.error('Error fetching courses:', err);
    return COURSES_DATA;
  }
}

// Helper to save a new course to Supabase
export async function createCourse(coursePayload) {
  const imageUrl = coursePayload.image || coursePayload.image_url || DEFAULT_COURSE_IMAGES[coursePayload.id] || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80";

  const newCourse = {
    id: coursePayload.id || `course-${Date.now()}`,
    title: coursePayload.title,
    subtitle: coursePayload.subtitle,
    description: coursePayload.description || coursePayload.subtitle,
    price: Number(coursePayload.price) || 49,
    projected_pay: coursePayload.projectedPay || "$50,000 – $150,000+ / year",
    access: coursePayload.access || "One-time • Lifetime access • Certificate on completion",
    image_url: imageUrl,
    outcomes: coursePayload.outcomes || [
      "Master industry standards and best practices.",
      "Get direct access to route opportunities.",
      "Earn official completion certificate."
    ],
    outline: coursePayload.outline || [
      {
        moduleNumber: 1,
        moduleTitle: "Course Fundamentals",
        lessons: ["Introduction to core concepts", "Setup and preparation"]
      }
    ],
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([newCourse])
      .select();

    if (error) {
      console.error('Supabase error inserting course:', error);
      return { ...newCourse, image: imageUrl };
    }
    return data ? formatCourse(data[0], 0) : { ...newCourse, image: imageUrl };
  } catch (err) {
    console.error('Failed to create course in Supabase:', err);
    return { ...newCourse, image: imageUrl };
  }
}

// Helper to update an existing course in Supabase
export async function updateCourse(courseId, coursePayload) {
  const updatedData = {
    title: coursePayload.title,
    subtitle: coursePayload.subtitle,
    description: coursePayload.description || coursePayload.subtitle,
    price: Number(coursePayload.price) || 49,
    projected_pay: coursePayload.projectedPay || "$50,000 – $150,000+ / year",
    outcomes: coursePayload.outcomes || [],
    outline: coursePayload.outline || []
  };

  if (coursePayload.image || coursePayload.image_url) {
    updatedData.image_url = coursePayload.image || coursePayload.image_url;
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updatedData)
      .eq('id', courseId)
      .select();

    if (error) {
      console.error('Supabase error updating course:', error);
    }
    return data ? formatCourse(data[0], 0) : updatedData;
  } catch (err) {
    console.error('Failed to update course in Supabase:', err);
    return updatedData;
  }
}

// Helper to delete a course from Supabase
export async function deleteCourse(courseId) {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Supabase error deleting course:', error);
    }
    return true;
  } catch (err) {
    console.error('Failed to delete course:', err);
    return false;
  }
}
