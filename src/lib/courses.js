import { supabase } from './supabase';

export const DEFAULT_COURSE_IMAGES = {
  "master-contractor": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
  "logistics-consultant": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
  "delivery-company": "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1600&q=80",
  "notary-public": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&q=80",
  "field-inspector": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
  "courier-dispatcher": "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80"
};



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
    created_at: c.created_at,
    status: c.status || 'ACTIVE'
  };
}

// Self-healing database insert helper
async function safeInsert(table, payload) {
  const { data, error } = await supabase.from(table).insert([payload]).select();
  if (error) {
    // If column doesn't exist, remove it and retry
    if (error.code === 'PGRST204' || error.message?.includes('column')) {
      const match = error.message?.match(/column "(\w+)"/);
      const missingColumn = match ? match[1] : null;
      if (missingColumn && payload.hasOwnProperty(missingColumn)) {
        const nextPayload = { ...payload };
        delete nextPayload[missingColumn];
        return await safeInsert(table, nextPayload);
      }
    }
    // Specific known schema fallbacks
    if (payload.hasOwnProperty('status')) {
      const nextPayload = { ...payload };
      delete nextPayload.status;
      return await safeInsert(table, nextPayload);
    }
    if (payload.hasOwnProperty('image_url')) {
      const nextPayload = { ...payload };
      delete nextPayload.image_url;
      return await safeInsert(table, nextPayload);
    }
    if (payload.hasOwnProperty('image')) {
      const nextPayload = { ...payload };
      delete nextPayload.image;
      return await safeInsert(table, nextPayload);
    }
    throw error;
  }
  return data;
}

// Self-healing database update helper
async function safeUpdate(table, id, payload) {
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
  if (error) {
    // If column doesn't exist, remove it and retry
    if (error.code === 'PGRST204' || error.message?.includes('column')) {
      const match = error.message?.match(/column "(\w+)"/);
      const missingColumn = match ? match[1] : null;
      if (missingColumn && payload.hasOwnProperty(missingColumn)) {
        const nextPayload = { ...payload };
        delete nextPayload[missingColumn];
        return await safeUpdate(table, id, nextPayload);
      }
    }
    // Specific known schema fallbacks
    if (payload.hasOwnProperty('status')) {
      const nextPayload = { ...payload };
      delete nextPayload.status;
      return await safeUpdate(table, id, nextPayload);
    }
    if (payload.hasOwnProperty('image_url')) {
      const nextPayload = { ...payload };
      delete nextPayload.image_url;
      return await safeUpdate(table, id, nextPayload);
    }
    if (payload.hasOwnProperty('image')) {
      const nextPayload = { ...payload };
      delete nextPayload.image;
      return await safeUpdate(table, id, nextPayload);
    }
    throw error;
  }
  return data;
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
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((c, index) => formatCourse(c, index));
  } catch (err) {
    console.error('Error fetching courses:', err);
    return [];
  }
}

// Helper to save a new course to Supabase with schema fallback
export async function createCourse(coursePayload) {
  const imageUrl = coursePayload.image || coursePayload.image_url || DEFAULT_COURSE_IMAGES[coursePayload.id] || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80";
  const status = coursePayload.status || 'ACTIVE';

  const newCourse = {
    id: coursePayload.id || `course-${Date.now()}`,
    title: coursePayload.title,
    subtitle: coursePayload.subtitle,
    description: coursePayload.description || coursePayload.subtitle,
    price: Number(coursePayload.price) || 49,
    projected_pay: coursePayload.projectedPay || "$50,000 – $150,000+ / year",
    access: coursePayload.access || "One-time • Lifetime access • Certificate on completion",
    status: status,
    image: imageUrl,
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
    const data = await safeInsert('courses', newCourse);
    if (data && data.length > 0) return formatCourse(data[0], 0);
    return { ...newCourse, image: imageUrl, status: status };
  } catch (err) {
    console.error('Failed to create course in Supabase:', err);
    return { ...newCourse, image: imageUrl, status: status };
  }
}

// Helper to update an existing course in Supabase with schema fallback
export async function updateCourse(courseId, coursePayload) {
  const status = coursePayload.status || 'ACTIVE';

  const updatedData = {
    title: coursePayload.title,
    subtitle: coursePayload.subtitle,
    description: coursePayload.description || coursePayload.subtitle,
    price: Number(coursePayload.price) || 49,
    projected_pay: coursePayload.projectedPay || "$50,000 – $150,000+ / year",
    access: coursePayload.access || "One-time • Lifetime access • Certificate on completion",
    status: status,
    outcomes: coursePayload.outcomes || [],
    outline: coursePayload.outline || []
  };

  const imgVal = coursePayload.image || coursePayload.image_url;
  if (imgVal) {
    updatedData.image_url = imgVal;
    updatedData.image = imgVal;
  }

  try {
    const data = await safeUpdate('courses', courseId, updatedData);
    return (data && data.length) ? formatCourse(data[0], 0) : updatedData;
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
