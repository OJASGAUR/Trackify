import { Heart, Sparkles, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="p-6 md:p-12 flex-1 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-red-500 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Trackify
            </h1>
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            Built with ❤️ for my hardworking mother
          </p>
        </div>

        {/* Main Message */}
        <Card className="mb-8 border-2 border-purple-200 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl text-purple-700">
              A Tool for Your Hard Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                <span className="font-semibold">Dear Mom,</span>
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Every day, you dedicate countless hours to your students, managing classes, assignments, and ensuring quality education. This app exists to simplify that burden—to give you back moments that matter.
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                With Trackify, tracking copy checking duties becomes effortless. Visualize your schedule, mark progress, and focus on what truly matters: teaching and inspiring the next generation.
              </p>
              <p className="text-base md:text-lg text-gray-600 italic leading-relaxed">
                Your dedication doesn't go unnoticed. This is my small way of saying thank you.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-purple-200">
              <div className="text-center">
                <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Dedicated to</p>
                <p className="text-xl font-bold text-purple-600">My Mother</p>
              </div>
              <div className="text-center">
                <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Made with</p>
                <p className="text-xl font-bold text-red-600">Love</p>
              </div>
              <div className="text-center">
                <Sparkles className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Inspired by</p>
                <p className="text-xl font-bold text-yellow-600">Gratitude</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-purple-100 shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <span>📅</span> Smart Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Automatically distributes copy checking duties across classes, ensuring a balanced workload throughout the month.
            </CardContent>
          </Card>

          <Card className="border-pink-100 shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-700">
                <span>✅</span> Track Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Mark tasks as completed and gain visual insights into your progress with an intuitive dashboard.
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <span>📊</span> Visual Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              See your entire month at a glance with color-coded task statuses and easy drag-and-drop rescheduling.
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <span>⚙️</span> Customizable
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Adjust settings for your classes, working days, and preferences to fit your unique teaching schedule.
            </CardContent>
          </Card>
        </div>

        {/* Closing Quote */}
        <Card className="border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardContent className="pt-8 text-center">
            <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
              "Teaching is the greatest act of optimism."
            </p>
            <p className="text-gray-600">
              — And you live this every single day.
            </p>
            <p className="text-sm text-gray-500 mt-6">
              Thank you for everything you do. 💜
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
