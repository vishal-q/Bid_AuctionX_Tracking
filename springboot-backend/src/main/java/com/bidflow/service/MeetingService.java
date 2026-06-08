package com.bidflow.service;

import com.bidflow.model.Meeting;
import com.bidflow.model.User;
import com.bidflow.repository.MeetingRepository;
import com.bidflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MeetingService {

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public Meeting scheduleMeeting(Meeting meeting) {
        Meeting saved = meetingRepository.save(meeting);
        
        // Send notification to both employee and client
        notificationService.createNotif(
            meeting.getEmployeeId(),
            "Meeting Scheduled",
            "A new meeting has been scheduled with " + meeting.getClientName(),
            "MEETING",
            meeting.getId()
        );
        
        notificationService.createNotif(
            meeting.getClientId(),
            "Meeting Scheduled",
            "A new meeting has been scheduled with " + meeting.getEmployeeName(),
            "MEETING",
            meeting.getId()
        );

        return saved;
    }

    public Optional<Meeting> getMeetingById(String id) {
        return meetingRepository.findById(id);
    }

    public List<Meeting> getMeetingsByEmployee(String employeeId) {
        return meetingRepository.findByEmployeeId(employeeId);
    }

    public List<Meeting> getMeetingsByClient(String clientId) {
        return meetingRepository.findByClientId(clientId);
    }

    public List<Meeting> getMeetingsByBid(String bidId) {
        return meetingRepository.findByBidId(bidId);
    }

    public List<Meeting> getUserMeetings(String userId) {
        return meetingRepository.findByEmployeeIdOrClientId(userId, userId);
    }

    public Meeting updateMeeting(String id, Meeting meeting) {
        Optional<Meeting> existing = meetingRepository.findById(id);
        if (existing.isPresent()) {
            Meeting m = existing.get();
            if (meeting.getTitle() != null) m.setTitle(meeting.getTitle());
            if (meeting.getScheduledTime() != null) m.setScheduledTime(meeting.getScheduledTime());
            if (meeting.getVideoplatform() != null) m.setVideoplatform(meeting.getVideoplatform());
            if (meeting.getVideoLink() != null) m.setVideoLink(meeting.getVideoLink());
            if (meeting.getStatus() != null) m.setStatus(meeting.getStatus());
            if (meeting.getNotes() != null) m.setNotes(meeting.getNotes());
            return meetingRepository.save(m);
        }
        return null;
    }

    public void cancelMeeting(String id) {
        Optional<Meeting> meeting = meetingRepository.findById(id);
        if (meeting.isPresent()) {
            Meeting m = meeting.get();
            m.setStatus("CANCELLED");
            meetingRepository.save(m);

            // Notify both parties
            notificationService.createNotif(
                m.getEmployeeId(),
                "Meeting Cancelled",
                "Meeting with " + m.getClientName() + " has been cancelled",
                "MEETING",
                m.getId()
            );
            
            notificationService.createNotif(
                m.getClientId(),
                "Meeting Cancelled",
                "Meeting with " + m.getEmployeeName() + " has been cancelled",
                "MEETING",
                m.getId()
            );
        }
    }

    public void completeMeeting(String id) {
        Optional<Meeting> meeting = meetingRepository.findById(id);
        if (meeting.isPresent()) {
            Meeting m = meeting.get();
            m.setStatus("COMPLETED");
            meetingRepository.save(m);
        }
    }
}
