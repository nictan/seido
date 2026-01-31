import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";

const StudentProfile = () => {
    const { userId } = useParams();

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">Student Profile</h1>
                <p>Viewing profile for user ID: {userId}</p>
            </main>
        </div>
    );
};

export default StudentProfile;
