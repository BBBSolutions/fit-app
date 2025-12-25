-- Seed Exercises Table
INSERT INTO exercises (name, category, image_url, video_url, muscles_targeted) VALUES
-- Chest
('Barbell Bench Press', 'Chest', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=rT7DgCr-3pg', ARRAY['Pectoralis Major', 'Triceps', 'Anterior Deltoids']),
('Dumbbell Flys', 'Chest', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=eozdVDA78K0', ARRAY['Pectoralis Major']),
('Push Ups', 'Chest', 'https://images.unsplash.com/photo-1598971639058-211a74a96ded?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=IODxDxX7oi4', ARRAY['Pectoralis Major', 'Triceps']),

-- Back
('Pull Ups', 'Back', 'https://images.unsplash.com/photo-1598971639058-211a74a96ded?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=eGo4IYlbE5g', ARRAY['Latissimus Dorsi', 'Biceps']),
('Barbell Rows', 'Back', 'https://images.unsplash.com/photo-1603287681836-e174ce71d374?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=G8l_8chR5BE', ARRAY['Latissimus Dorsi', 'Rhomboids']),
('Lat Pulldowns', 'Back', 'https://images.unsplash.com/photo-1603287681836-e174ce71d374?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=CAwf7n6Luuc', ARRAY['Latissimus Dorsi']),

-- Legs
('Barbell Squat', 'Legs', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=SW_C1A-rejs', ARRAY['Quadriceps', 'Glutes', 'Hamstrings']),
('Leg Press', 'Legs', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', ARRAY['Quadriceps', 'Glutes']),
('Lunges', 'Legs', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=QOVaHwm-Q6U', ARRAY['Quadriceps', 'Glutes', 'Hamstrings']),

-- Shoulders
('Overhead Press', 'Shoulders', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=2yjwXTZQDDI', ARRAY['Deltoids', 'Triceps']),
('Lateral Raises', 'Shoulders', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=3VcKaXpzqRo', ARRAY['Lateral Deltoids']),

-- Arms
('Barbell Curls', 'Biceps', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=kwG2ipFRgfo', ARRAY['Biceps Brachii']),
('Tricep Dips', 'Triceps', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80', 'https://www.youtube.com/watch?v=6kALZikXxLc', ARRAY['Triceps Brachii']),

-- Cardio
('Treadmill Run', 'Cardio', 'https://images.unsplash.com/photo-1538805060504-d141a4787445?auto=format&fit=crop&w=400&q=80', NULL, ARRAY['Quadriceps', 'Calves', 'Cardiovascular System']),
('Cycling', 'Cardio', 'https://images.unsplash.com/photo-1538805060504-d141a4787445?auto=format&fit=crop&w=400&q=80', NULL, ARRAY['Quadriceps', 'Hamstrings', 'Cardiovascular System']);
