import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {  FaHistory, FaSignOutAlt } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import {  buttonVariant, modalVariant } from './animations';
import { motion } from 'framer-motion';
import { FaCrown } from 'react-icons/fa';
import oneVectorImage from './images/onevector.png'; 
import MagicLinkHistoryPopup from './MagicLinkHistoryPopup';
import * as XLSX from 'xlsx'; 
import {DownloadIcon,SunIcon, MoonIcon } from '@heroicons/react/solid';
import { Button } from "@/components/ui/button"
import { useTheme } from "../ThemeContext"; // Ensure correct import path
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead,TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import TutorialOverlay from './TutorialOverlay';
import LoadingSpinner from './LoadingSpinner';


function PowerUserDashboard() {
  const [details, setDetails] = useState(null);
  const [email, setEmail] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [sentEmails, setSentEmails] = useState([]);
  const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState(''); // Updated state for success message
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [showMagicLinkPopup, setShowMagicLinkPopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
const [magicLinks, setMagicLinks] = useState([]);
const { isDarkMode, toggleTheme } = useTheme();

const handleDownloadDetails = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/candidates'); // Fetch candidates

    if (response.data.length === 0) {
      alert('No candidate details available to download.');
      return;
    }

    // Create an array to hold all candidate details
    const candidatesWithDetails = await Promise.all(response.data.map(async (candidate) => {
      // Fetch personal details for each candidate
      const personalDetailsResponse = await axios.get(`http://localhost:3000/api/personalDetails/${candidate.id}`);
      const personalDetails = personalDetailsResponse.data;

      // Combine candidate and personal details
      return {
        FirstName: personalDetails.personalDetails.first_name || 'N/A',
        LastName: personalDetails.personalDetails.last_name || 'N/A',
        Email: candidate.email || 'N/A',
        Role: candidate.role || 'N/A',
        Username: candidate.username || 'N/A',
        Phone: personalDetails.personalDetails.phone_no || 'N/A',
        Address: `${personalDetails.personalDetails.address_line1 || ''}, ${personalDetails.personalDetails.address_line2 || ''}`,
        City: personalDetails.personalDetails.city || 'N/A',
        State: personalDetails.personalDetails.state || 'N/A',
        Country: personalDetails.personalDetails.country || 'N/A',
        PostalCode: personalDetails.personalDetails.postal_code || 'N/A',
        LinkedIn: personalDetails.personalDetails.linkedin_url || 'N/A',
        ResumePath: personalDetails.personalDetails.resume_path || 'N/A',
        RecentJob: personalDetails.qualifications[0]?.recent_job || 'N/A',
        PreferredRoles: personalDetails.qualifications[0]?.preferred_roles || 'N/A',
        Availability: personalDetails.qualifications[0]?.availability || 'N/A',
        WorkPermitStatus: personalDetails.qualifications[0]?.work_permit_status || 'N/A',
        PreferredRoleType: personalDetails.qualifications[0]?.preferred_role_type || 'N/A',
        PreferredWorkArrangement: personalDetails.qualifications[0]?.preferred_work_arrangement || 'N/A',
        Compensation: personalDetails.qualifications[0]?.compensation || 'N/A',
        Skills: personalDetails.skills.join(', ') || 'N/A',
        Certifications: personalDetails.certifications.join(', ') || 'N/A',
      };
    }));

    // Generate an Excel worksheet
    const worksheet = XLSX.utils.json_to_sheet(candidatesWithDetails);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');

    // Trigger download of the Excel file
    XLSX.writeFile(workbook, 'Candidate_Details.xlsx');
  } catch (error) {
    console.error('Error downloading candidate details:', error);
    alert(`Failed to download candidate details: ${error.message}`);
  }
};

useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:3000/api/candidates');
        const filteredCandidates = response.data
        .filter(candidate => candidate.role === 'user') // Only show 'user' role candidates
        .sort((a, b) => a.id - b.id); // Sort by ID

        setCandidates(filteredCandidates);
      } catch (error) {
        setError('Failed to fetch candidates');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const fetchMagicLinks = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/magic-links');
        setMagicLinks(response.data);
        setShowHistoryPopup(true);
    } catch (error) {
        alert('Failed to fetch magic links');
        console.error('Fetch error:', error);
    }
};
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this candidate and all their associated data?')) {
      try {
        console.log(`Attempting to delete candidate with ID: ${id}`);
        const response = await axios.delete(`http://localhost:3000/api/candidates/${id}`);
        console.log('Delete response:', response);
        
        // Update candidates list after successful deletion
        setCandidates(candidates.filter((candidate) => candidate.id !== id));
        
        // Show success message
        setSuccessMessageText('Candidate deleted successfully!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Error deleting candidate:', error);
        alert('Failed to delete candidate');
      }
    }
  };

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  const toggleRole = (candidate) => {
    setSelectedCandidate(candidate);
    setIsRoleChangeModalOpen(true);
  };

  const sendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email.');
      return;
    }
  
    try {
      setIsSendingMagicLink(true);
      const response = await axios.post('http://localhost:3000/api/send-magic-link', { email });
  
      if (response.status === 200) {
        localStorage.setItem('magicLinkEmail', email);
        setSentEmails((prev) => [...prev, email]);
        setEmail('');
        setSuccessMessageText('Magic Link sent successfully!');
        setShowSuccessMessage(true);
        setShowForm(false);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        throw new Error('Failed to send magic link. Server error.');
      }
    } catch (error) {
      console.error('Error sending magic link:', error);
      alert(error.response?.data?.error || 'Failed to send magic link. Please try again.');
    } finally {
      setIsSendingMagicLink(false);
    }
  };


  const filteredCandidates = candidates.filter((candidate) =>
    candidate.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleShowDetails = (candidate) => {
    navigate('/power-candidate-details', { state: { candidate } });
  };

  const isActive = (path) => location.pathname === path;

  const handleHistoryClick = () => {
    setHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setHistoryModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!selectedCandidate) return;
  
    try {
      // First update the UI
      setCandidatesWithDetails(prev => 
        prev.filter(candidate => candidate.id !== selectedCandidate.id)
      );
      setCandidates(prev => 
        prev.filter(candidate => candidate.id !== selectedCandidate.id)
      );
      setIsDeleteModalOpen(false);
      setSuccessMessageText('Candidate deleted successfully!');
      setShowSuccessMessage(true);
  
      // Then perform the deletion in the background
      await axios.delete(`http://localhost:3000/api/qualifications/${selectedCandidate.id}`);
      await axios.delete(`http://localhost:3000/api/user_skills/${selectedCandidate.id}`);
      await axios.delete(`http://localhost:3000/api/user_certifications/${selectedCandidate.id}`);
      await axios.delete(`http://localhost:3000/api/personaldetails/${selectedCandidate.id}`);
      await axios.delete(`http://localhost:3000/api/candidates/${selectedCandidate.id}`);
  
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      // If deletion fails, revert the UI changes
      console.error('Delete error:', error);
      alert('Failed to delete candidate. Please try again.');
      // Refresh the candidates list to restore the correct state
      fetchCandidatesWithDetails();
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} font-sans`}>
     {/* Magic Link Popup */}
  {showMagicLinkPopup && (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-20">
      <Alert className="w-96 border-none bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-xl">
        <Check className="h-5 w-5" />
        <AlertDescription className="text-center text-lg font-semibold">
          Magic Link sent successfully!
        </AlertDescription>
      </Alert>
    </div>
  )}

 {/* Success Card */}
 {showSuccessMessage && (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-20">
      <Card className="w-96 bg-white dark:bg-gray-800 shadow-2xl p-8 transform transition-all duration-300 ease-in-out hover:scale-105">
        <div className="relative mx-auto w-16 h-16 mb-6">
          <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-75" />
          <div className="relative flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Success!
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-6">
          {successMessageText}
        </p>
        
        <Button
          onClick={() => setShowSuccessMessage(false)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold py-6"
        >
          Close
        </Button>
      </Card>
    </div>
  )}
{/* Header Section */}
<header
  className={cn(
    "fixed top-0 left-0 right-0 z-10 shadow-md",
    isDarkMode ? "bg-gray-800" : "bg-white"
  )}
>
  <div className="flex justify-between items-center p-2 sm:p-4 w-full">
    {/* Logo and Title */}
    <div className="flex items-center space-x-2">
      <img
        src={oneVectorImage}
        alt="OneVector Logo"
        className="w-5 h-6 sm:w-8 sm:h-8"
      />
      <h1
        className={cn(
          "text-lg sm:text-2xl font-semibold tracking-wide",
          "text-transparent bg-clip-text bg-gradient-to-r from-[#15BACD] to-[#094DA2]"
        )}
      >
        TalentHub
      </h1>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center space-x-2">
      {/* Dark Mode Toggle Button */}
      <Toggle
        onClick={toggleTheme}
        className={cn(
          "p-1 sm:p-2 rounded-full",
          isDarkMode
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-gray-200 hover:bg-gray-300"
        )}
      >
        {isDarkMode ? (
          <SunIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-100" />
        ) : (
          <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
        )}
      </Toggle>

      {/* Logout Button */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className={cn(
          "px-3 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 rounded-full flex items-center justify-center space-x-2 text-sm sm:text-base font-semibold transition-all",
          isDarkMode
            ? "bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800"
            : "bg-gradient-to-r from-red-400 to-red-600 text-white hover:from-red-500 hover:to-red-700"
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-4 h-4 sm:w-5 sm:h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-7.5A2.25 2.25 0 003.75 5.25v13.5A2.25 2.25 0 006 21h7.5a2.25 2.25 0 002.25-2.25V15"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 12H9m0 0l3-3m-3 3l3 3"
          />
        </svg>
        <span>Logout</span>
      </Button>
    </div>
  </div>
</header>

<main className="pt-16 px-4 sm:px-0 w-full bg-white text-black dark:bg-gray-900 dark:text-white">
  <div className="flex flex-col md:flex-row justify-between items-center mb-4 mt-8 gap-4 w-full">
    {/* Search Input */}
    <Input
      type="text"
      placeholder="Search by name, email, skills, certifications, or qualifications"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full md:w-1/2 border border-gray-300 bg-white text-black rounded-xl p-3 focus:ring-2 focus:ring-gray-500 transition-all duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-700"
      data-tutorial="search"
    />

    {/* Buttons and History Icon */}
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full md:w-auto mt-4 md:mt-0">
      <Button
        onClick={handleDownloadDetails}
        variant="solid"
        className="px-3 sm:px-4 py-2 h-10 text-white font-medium rounded-xl flex items-center justify-center bg-[#094DA2] border border-[#094DA2] hover:bg-[#093A8E] transition-all duration-200 transform hover:scale-105 focus:outline-none dark:bg-[#094DA2] dark:border-[#094DA2] dark:hover:bg-[#093A8E]"
        data-tutorial="download"
      >
        <DownloadIcon className="h-5 w-5 mr-2 text-white" />
        DETAILS
      </Button>

      {/* Add User Button */}
      <Button
        onClick={() => setShowForm(true)}
        variant="solid"
        className="px-3 sm:px-4 py-2 h-10 text-white font-medium rounded-xl flex items-center justify-center bg-[#094DA2] border border-[#094DA2] hover:bg-[#093A8E] transition-all duration-200 transform hover:scale-105 focus:outline-none dark:bg-[#094DA2] dark:border-[#094DA2] dark:hover:bg-[#093A8E]"
        data-tutorial="add-user"
      >
        <span className="text-lg font-bold">+</span>
        ADD USER
      </Button>

      {/* History Icon */}
      <FaHistory
        size={18}
        className="cursor-pointer mr-2 text-[#094DA2] transition-all duration-200 transform hover:scale-105 dark:text-[#094DA2] dark:hover:scale-110"
        onClick={fetchMagicLinks}
        data-tutorial="history"
      />
    </div>
  </div>



  {/* Magic Link History Popup */}
  {showHistoryPopup && (
    <MagicLinkHistoryPopup
      magicLinks={magicLinks}
      onClose={() => setShowHistoryPopup(false)}
    />
  )}

  

{showForm && (
  <Dialog open={showForm} onOpenChange={(open) => setShowForm(open)}>
    <DialogTrigger asChild>
      <Button className="hidden">Open Modal</Button>
    </DialogTrigger>
    <DialogContent
      className={`
        sm:max-w-md w-[calc(100%-2rem)] mx-auto
        p-4 sm:p-6 md:p-8
        rounded-xl shadow-xl
        transition-all duration-200
        ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}
      `}
    >
      <DialogHeader className="space-y-2 sm:space-y-3">
        <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
          Add a New User
        </DialogTitle>
        <DialogDescription 
          className={`text-sm sm:text-base ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          Enter the email address of the new user.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col space-y-5">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`
            h-11 sm:h-12
            px-4 text-base
            rounded-lg
            transition-all duration-200
            focus:outline-none focus:ring-2
            ${isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500/40 placeholder-gray-400' 
              : 'border-gray-200 focus:ring-blue-500/40 placeholder-gray-500 hover:border-gray-300'
            }
          `}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <Button
            onClick={() => setShowForm(false)}
            className={`
              h-11 sm:h-12 px-6
              text-base font-medium
              rounded-lg
              transition-all duration-200
              ${isDarkMode
                ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }
            `}
          >
            Cancel
          </Button>

          <Button
            onClick={sendMagicLink}
            className={`
              h-11 sm:h-12 px-6
              text-base font-medium
              rounded-lg
              transition-all duration-200
              ${isDarkMode
                ? 'bg-gradient-to-r from-[#094DA2] to-[#15abcd] text-gray-100'
                : 'bg-gradient-to-r from-[#15ABCD] to-[#094DA2] text-white'
              }
              hover:opacity-90 disabled:opacity-60
              flex-1 sm:flex-none sm:min-w-[140px]
            `}
            disabled={isSendingMagicLink}
          >
            {isSendingMagicLink ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                <span>Sending...</span>
              </div>
            ) : (
              'Send Magic Link'
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}
  {/* Table section with proper loading state */}
  {loading ? (
          <div className="flex justify-center items-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className={`bg-white dark:bg-gray-800 shadow-md overflow-hidden mt-8 w-full`}>
            {filteredCandidates.length ? (
              <Table className="w-full text-left border-collapse font-roboto-light">
        <TableHeader className="bg-[#EAF3FF] text-white dark:bg-gray-800 dark:text-white">
          <TableRow>
            <TableHead className="py-4 px-6 text-sm font-bold text-black border-r-[2px] border-white dark:text-white dark:border-gray-700">
              TITLE
            </TableHead>
            <TableHead className="py-4 px-6 text-sm font-bold text-black border-r-[2px] border-white dark:text-white dark:border-gray-700">
              EMAIL
            </TableHead>
            <TableHead className="py-4 px-6 text-sm font-bold text-black border-r-[2px] border-white text-center dark:text-white dark:border-gray-700">
              ROLE
            </TableHead>
            <TableHead className="py-4 px-6 text-sm font-bold text-black border-r-[2px] border-white text-center dark:text-white dark:border-gray-700">
              USERNAME
            </TableHead>
            <TableHead className="py-4 px-6 text-sm font-bold text-black text-center dark:text-white dark:border-gray-700">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="bg-white dark:bg-gray-900">
          {filteredCandidates.map((candidate, index) => (
            <TableRow
              key={candidate.id}
              className={`border-b border-gray-200 dark:border-gray-700 ${index === filteredCandidates.length - 1 ? '' : 'border-b-2'} hover:bg-transparent dark:hover:bg-gray-700`}
            >
              <TableCell className="py-2.5 px-3 text-gray-800 dark:text-white">
  <div className="flex items-center space-x-2">
    <span className="font-medium">
      {candidate.first_name && candidate.last_name
        ? `${candidate.first_name} ${candidate.last_name}`
        : candidate.first_name || candidate.last_name || "N/A"}
    </span>
    {candidate.role === "power_user" && (
      <FontAwesomeIcon icon={faCrown} className="text-yellow-500" title="Power User" />
    )}
  </div>
</TableCell>

              <TableCell className="py-2.5 px-3 text-gray-700 dark:text-white">
                {candidate.email}
              </TableCell>
              <TableCell className="py-2.5 px-3 text-center">
                <span className="text-sm font-medium text-gray-700 dark:text-white">
                  {candidate.role === "power_user" ? "Power User" : "User"}
                </span>
              </TableCell>
              <TableCell className="py-2.5 px-3 text-center">
                <span className="font-medium text-[#4F8FD7] dark:text-[#4F8FD7]">
                  {candidate.username}
                </span>
              </TableCell>
              <TableCell className="py-2.5 px-3 text-center">
              <div className="flex justify-center items-center gap-2" data-tutorial="actions">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 focus:ring-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
                  >
                    Delete
                  </Button>
                  <Button
  variant="secondary"
  onClick={() => handleShowDetails(candidate)}
  className="px-3 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 dark:bg-[#1F2937] dark:hover:bg-[#374151] dark:text-white dark:border dark:border-white"
>
  Details
              </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
     ) : (
      <p className="p-4 text-center text-gray-800 dark:text-white">No candidates found.</p>
    )}
  </div>
        )
      }
</main>
  {/* History Modal */}
      {historyModalOpen && (
        <motion.div
          variants={modalVariant}
          initial="hidden"
          animate="visible"
          className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-20"
        >
          <motion.div
            variants={modalVariant}
            className="bg-white p-6 rounded-lg shadow-lg w-96"
          >
            <h3 className="text-lg font-semibold text-black mb-4">History</h3>
            <div className="overflow-y-auto max-h-64 space-y-2">
              {sentEmails.length > 0 ? (
                sentEmails.map((email, index) => (
                  <div
                    key={index}
                    className="border border-black p-2 rounded-lg bg-gray-50"
                  >
                    <p className="text-black">{email}</p>
                    <p className="text-sm text-gray-600">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-black">No history available.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <motion.button
                variants={buttonVariant}
                whileHover="hover"
                whileTap="tap"
                onClick={closeHistoryModal}
                className="px-4 py-2 bg-white border border-black text-black rounded-lg hover:bg-black hover:text-white"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedCandidate && (
        <motion.div
          variants={modalVariant}
          initial="hidden"
          animate="visible"
          className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            variants={modalVariant}
            className="bg-white p-6 rounded-lg shadow-lg w-96"
          >
            <h3 className="text-lg font-semibold text-black">Confirm Deletion</h3>
            <p className="my-4 text-black">
              Are you sure you want to delete {selectedCandidate.username}?
            </p>
           <div className="flex justify-end space-x-4">
  <motion.button
    variants={buttonVariant}
    whileHover="hover"
    whileTap="tap"
    onClick={() => setIsDeleteModalOpen(false)}
    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
  >
    Cancel
  </motion.button>
  
  <motion.button
    variants={buttonVariant}
    whileHover="hover"
    whileTap="tap"
    onClick={confirmDelete}
    className="px-4 py-2 bg-gradient-to-r from-[#15ABCD] to-[#094DA2] text-white rounded-lg"
  >
    Confirm
  </motion.button>
</div>

          </motion.div>
        </motion.div>
      )}

      {showTutorial && (
  <TutorialOverlay onClose={() => setShowTutorial(false)} />
)}
    </div>
  );
}

export default PowerUserDashboard;
