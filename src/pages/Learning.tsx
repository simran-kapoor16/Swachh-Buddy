import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, Users, GraduationCap, Recycle, Play, Clock, Award,
  Target, CheckCircle, Star, Gamepad2, Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import LearningGames from "@/components/LearningGames";

const Learning = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const { toast } = useToast();

  const trainingLevels = [
    {
      id: 1,
      title: "Waste Management Basics",
      description: "Understanding the fundamentals of waste management, types of waste, and the 3 R's principle",
      modules: 8, duration: "2 hours", difficulty: "Beginner",
      completed: false, rating: 4.8, enrolled: 12500,
      content: ["What is Waste? - Types and Sources", "The 3 R's: Reduce, Reuse, Recycle", "Waste Segregation - Color Coding System", "Composting Basics", "Plastic Waste Management", "E-waste Handling", "Hazardous Waste Safety", "Community Participation"],
      quiz: { questions: 25, passingScore: 80, attempts: 3 },
      certificate: true, route: "/learning/waste-basics", completionRate: 0
    },
    {
      id: 2,
      title: "Advanced Segregation Techniques",
      description: "Master the art of proper waste separation with hands-on training and real-world scenarios",
      modules: 6, duration: "1.5 hours", difficulty: "Intermediate",
      completed: false, rating: 4.7, enrolled: 8900,
      content: ["Advanced Color Coding Systems", "Wet Waste Processing Methods", "Dry Waste Identification", "Hazardous Material Recognition", "Industrial Waste Categories", "Medical Waste Protocols"],
      quiz: { questions: 20, passingScore: 85, attempts: 3 },
      certificate: true, route: "/learning/advanced-segregation", completionRate: 0
    },
    {
      id: 3,
      title: "Waste Processing & Recycling",
      description: "Learn about waste processing facilities, recycling methods, and circular economy principles",
      modules: 10, duration: "3 hours", difficulty: "Advanced",
      completed: false, rating: 4.9, enrolled: 5600,
      content: ["Waste Treatment Technologies", "Recycling Industry Overview", "Material Recovery Facilities", "Composting Plant Operations", "Waste-to-Energy Systems", "Circular Economy Principles", "Supply Chain Management", "Quality Control in Recycling", "Environmental Impact Assessment", "Policy and Regulations"],
      quiz: { questions: 30, passingScore: 90, attempts: 2 },
      certificate: true, route: "/learning/waste-processing", completionRate: 0
    }
  ];

  const specializedCourses = {
    ragpickers: [
      { id: "rp-1", title: "Safety First: Personal Protection", description: "Essential safety protocols and protective equipment usage", duration: "1.5 hours", modules: 3, level: "Essential", rating: 4.8, students: 1200 },
      { id: "rp-2", title: "Efficient Collection Techniques", description: "Optimize your collection routes and sorting methods", duration: "2 hours", modules: 4, level: "Intermediate", rating: 4.7, students: 890 },
      { id: "rp-3", title: "Digital Tools & Income Tracking", description: "Use mobile apps to track earnings and connect with buyers", duration: "1 hour", modules: 2, level: "Beginner", rating: 4.9, students: 650 }
    ],
    students: [
      { id: "st-1", title: "Campus Sustainability Champion", description: "Lead waste reduction initiatives in your school/college", duration: "3 hours", modules: 6, level: "Intermediate", rating: 4.6, students: 2100 },
      { id: "st-2", title: "Environmental Science & Waste", description: "Scientific understanding of waste impact on ecosystems", duration: "4 hours", modules: 8, level: "Advanced", rating: 4.8, students: 1500 },
      { id: "st-3", title: "Project Planning for Clean Drives", description: "Organize and execute successful clean-up campaigns", duration: "2 hours", modules: 4, level: "Beginner", rating: 4.5, students: 980 }
    ],
    communities: [
      { id: "cm-1", title: "Community Mobilization", description: "Engage neighbors and local groups in waste management", duration: "2.5 hours", modules: 5, level: "Intermediate", rating: 4.7, students: 750 },
      { id: "cm-2", title: "Local Policy & Advocacy", description: "Work with local authorities for better waste systems", duration: "3 hours", modules: 6, level: "Advanced", rating: 4.6, students: 420 }
    ]
  };

  const handleStartTraining = (levelId: number, route?: string) => {
    if (route) { navigate(route); }
    else { toast({ title: "Starting Training Level", description: `Redirecting to Level ${levelId}...` }); }
  };

  const handleStartCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    toast({ title: "Course Starting Soon", description: "Preparing your learning experience..." });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": case "Essential": return "bg-green-500";
      case "Intermediate": return "bg-yellow-500";
      case "Advanced": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const CourseCard = ({ course, onStart }: { course: any; onStart: () => void }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2 md:pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">{course.level || course.difficulty}</Badge>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs md:text-sm">{course.rating}</span>
          </div>
        </div>
        <CardTitle className="text-base md:text-lg">{course.title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{course.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{(course.students || course.enrolled || 0).toLocaleString()}</span>
            </div>
          </div>
          <Button onClick={onStart} className="w-full" size="sm">
            <Play className="mr-2 h-3.5 w-3.5" /> Start Course
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header — responsive */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-primary/10 rounded-full">
                <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold">Learning Hub</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs md:text-sm">
              <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Comprehensive waste management education for everyone - from basic training to specialized courses
          </p>
        </div>

        <Tabs defaultValue="core-training" className="space-y-6 md:space-y-8">
          {/* FIXED: Scrollable tabs on mobile instead of cramped grid */}
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex w-max min-w-full md:grid md:grid-cols-5 md:w-full gap-1 md:gap-0 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="core-training" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs md:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Book className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Core Training</span>
              </TabsTrigger>
              <TabsTrigger value="rag-pickers" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs md:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Recycle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Rag Pickers</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs md:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Students</span>
              </TabsTrigger>
              <TabsTrigger value="communities" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs md:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Communities</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs md:text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Gamepad2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Games</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Core Training */}
          <TabsContent value="core-training" className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-2">Mandatory Training Levels</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Complete all 3 levels to get certified and access advanced features
              </p>
            </div>
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
              {trainingLevels.map((level) => (
                <Card key={level.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2 md:pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`${getDifficultyColor(level.difficulty)} text-white text-xs`}>
                        {level.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs md:text-sm">{level.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="text-base md:text-xl">{level.title}</CardTitle>
                    <CardDescription className="text-xs md:text-sm">{level.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Book className="h-3.5 w-3.5" /><span>{level.modules} modules</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /><span>{level.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /><span>{level.enrolled.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5" /><span>Certificate</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-xs md:text-sm">Course Content:</h4>
                        <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                          {level.content.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                          {level.content.length > 3 && (
                            <div className="text-xs text-muted-foreground ml-4">
                              +{level.content.length - 3} more modules
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span>Progress</span><span>{level.completionRate}%</span>
                        </div>
                        <Progress value={level.completionRate} className="h-2" />
                      </div>
                      <Button onClick={() => handleStartTraining(level.id, level.route)} className="w-full" size="sm">
                        <Play className="mr-2 h-3.5 w-3.5" /> Start Training
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rag Pickers */}
          <TabsContent value="rag-pickers" className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                <Recycle className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                <h2 className="text-xl md:text-2xl font-semibold">Courses for Rag Pickers</h2>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">Specialized training to improve safety, efficiency, and income</p>
            </div>
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {specializedCourses.ragpickers.map((course) => (
                <CourseCard key={course.id} course={course} onStart={() => handleStartCourse(course.id)} />
              ))}
            </div>
          </TabsContent>

          {/* Students */}
          <TabsContent value="students" className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                <h2 className="text-xl md:text-2xl font-semibold">Courses for Students</h2>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">Educational content for schools, colleges, and young changemakers</p>
            </div>
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {specializedCourses.students.map((course) => (
                <CourseCard key={course.id} course={course} onStart={() => handleStartCourse(course.id)} />
              ))}
            </div>
          </TabsContent>

          {/* Communities */}
          <TabsContent value="communities" className="space-y-4 md:space-y-6">
            <div className="text-center mb-4 md:mb-6">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                <h2 className="text-xl md:text-2xl font-semibold">Community Leadership</h2>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">Build skills to lead waste management initiatives in your community</p>
            </div>
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
              {specializedCourses.communities.map((course) => (
                <CourseCard key={course.id} course={course} onStart={() => handleStartCourse(course.id)} />
              ))}
            </div>
          </TabsContent>

          {/* Games */}
          <TabsContent value="games" className="space-y-4 md:space-y-6">
            <LearningGames />
          </TabsContent>
        </Tabs>

        {/* Achievement Section */}
        <Card className="mt-6 md:mt-8 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-primary/10 rounded-full flex-shrink-0">
                  <Award className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold">Earn Certificates</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Complete courses and get recognized for your contribution to sustainable India
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0 w-full sm:w-auto">
                View Achievements
                <Target className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Learning;
