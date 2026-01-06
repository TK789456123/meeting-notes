-- Create profiles table that mirrors auth.users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (id)
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Meetings Table
CREATE TABLE public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  agenda TEXT,
  notes TEXT,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id)
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Participants Table (Many-to-Many)
CREATE TABLE public.participants (
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, user_id)
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Action Items Table
CREATE TABLE public.action_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assignee_id UUID REFERENCES public.profiles(id),
  deadline TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false
);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Policies for Meetings
-- Allow organizer to do everything
CREATE POLICY "Organizer can do everything on meetings"
  ON public.meetings
  USING (auth.uid() = organizer_id);

-- Allow participants to view meetings
CREATE POLICY "Participants can view meetings"
  ON public.meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.participants
      WHERE meeting_id = meetings.id AND user_id = auth.uid()
    )
  );

-- Policies for Participants
CREATE POLICY "Everyone can view participants"
  ON public.participants FOR SELECT
  USING (true);

CREATE POLICY "Organizer can manage participants"
  ON public.participants
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE id = participants.meeting_id AND organizer_id = auth.uid()
    )
  );

-- Policies for Action Items
CREATE POLICY "Participants and Organizer can view action items"
  ON public.action_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.meeting_id = action_items.meeting_id AND p.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = action_items.meeting_id AND m.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Participants and Organizer can create action items"
  ON public.action_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.meeting_id = meeting_id AND p.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_id AND m.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Assignee or Organizer can update action items"
  ON public.action_items FOR UPDATE
  USING (
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = action_items.meeting_id AND m.organizer_id = auth.uid()
    )
  );
